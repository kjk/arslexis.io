package main

import (
	"bytes"
	"context"
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/felixge/httpsnoop"
	hutil "github.com/kjk/common/httputil"

	"github.com/google/go-github/github"
	"github.com/kjk/common/u"
	"golang.org/x/exp/slices"
	"golang.org/x/oauth2"
)

var (
	//go:embed dist/*
	wwwFS embed.FS
	//go:embed secrets.env
	secretsEnv []byte

	fsys fs.FS
)

var (
	// must be same as vite.config.js
	proxyURLStr = "http://localhost:3025"
)

var (
	// random string for oauth2 API calls to protect against CSRF
	oauthSecretPrefix = "3212431324-"
)

// we need different oauth callbacks for different hosts so we registered 3 apps:
// https://github.com/settings/applications/1159176 : localhost
// https://github.com/settings/applications/2098699 : onlinetool.io
// https://github.com/settings/applications/2495749 : tools.arslexis.io
func getGithubConfig(r *http.Request) *oauth2.Config {
	endpoint := oauth2.Endpoint{
		AuthURL:  "https://github.com/login/oauth/authorize",
		TokenURL: "https://github.com/login/oauth/access_token",
	}
	conf := &oauth2.Config{
		ClientID:     "",
		ClientSecret: "",
		// select level of access you want https://developer.github.com/v3/oauth/#scopes
		Scopes:   []string{"user:email", "read:user", "gist"},
		Endpoint: endpoint,
	}
	host := strings.ToLower(r.Host)
	if strings.Contains("localhost", host) {
		conf.ClientID = "77ba1cbe7c0eff7c462b"
		conf.ClientSecret = secretGitHubLocal
	} else if strings.Contains("onlinetool.io", host) {
		conf.ClientID = "389af84bdce4b478ad7b"
		conf.ClientSecret = secretGitHubOnlineTool
	} else if strings.Contains("tools.arslexis.io", host) {
		conf.ClientID = "ff6bcecdb5df037a208d"
		conf.ClientSecret = secretGitHubToolsArslexis
	} else {
		panicIf(true, "unsupported host: %s", host)
	}
	return conf
}

func logLogin(ctx context.Context, r *http.Request, token *oauth2.Token) {
	conf := getGithubConfig(r)
	oauthClient := conf.Client(ctx, token)
	client := github.NewClient(oauthClient)
	user, _, err := client.Users.Get(ctx, "")
	if err != nil {
		logf("client.Users.Get() faled with '%s'\n", err)
		return
	}
	logf("logged in as GitHub user: %s\n", *user.Login)
	m := map[string]string{}
	if user.Login != nil {
		m["user"] = *user.Login
	}
	if user.Email != nil {
		m["email"] = *user.Email
	}
	if user.Name != nil {
		m["name"] = *user.Name
	}
	pirschSendEvent(r, "github_login", 0, m)
}

// /auth/githubcb
// as set in https://github.com/settings/applications/1159140
func handleGithubCallback(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	logf("handleGithubCallback: '%s'\n", r.URL)
	state := r.FormValue("state")
	if !strings.HasPrefix(state, oauthSecretPrefix) {
		logErrorf("invalid oauth state, expected '%s*', got '%s'\n", oauthSecretPrefix, state)
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	code := r.FormValue("code")
	conf := getGithubConfig(r)
	token, err := conf.Exchange(context.Background(), code)
	if err != nil {
		logErrorf("oauthGoogleConf.Exchange() failed with '%s'\n", err)
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}
	logf("token: %#v", token)
	ac := token.AccessToken
	uri := "/github_success?access_token=" + ac
	logf("token: %#v\nuri: %s\n", token, uri)
	http.Redirect(w, r, uri, http.StatusTemporaryRedirect)

	// can't put in the background because that cancels ctx
	logLogin(ctx, r, token)
}

// /auth/ghlogin
func handleLoginGitHub(w http.ResponseWriter, r *http.Request) {
	// GitHub seems to completely ignore Redir, which makes testing locally hard
	// TODO: generate temporary oathSecret
	conf := getGithubConfig(r)
	uri := conf.AuthCodeURL(oauthSecretPrefix, oauth2.AccessTypeOnline)
	logf("handleLoginGitHub: to '%s'\n", uri)
	http.Redirect(w, r, uri, http.StatusTemporaryRedirect)
}

func permRedirect(w http.ResponseWriter, r *http.Request, newURL string) {
	http.Redirect(w, r, newURL, http.StatusPermanentRedirect)
}

// in dev, proxyHandler redirects assets to vite web server
// in prod, assets must be pre-built in frontend/dist directory
func makeHTTPServer(serveOpts *hutil.ServeFileOptions, proxyHandler *httputil.ReverseProxy) *http.Server {
	panicIf(serveOpts == nil, "must provide serveOpts")

	mainHandler := func(w http.ResponseWriter, r *http.Request) {
		uri := r.URL.Path
		logf("mainHandler: RequestURI: '%s', uri: '%s'\n", r.RequestURI, uri)

		switch uri {
		case "/ping", "/ping.txt":
			content := bytes.NewReader([]byte("pong"))
			http.ServeContent(w, r, "foo.txt", time.Time{}, content)
			return
		case "/auth/ghlogin":
			handleLoginGitHub(w, r)
			return
		case "/auth/githubcb":
			handleGithubCallback(w, r)
			return
		}

		if strings.HasPrefix(uri, "/event/") {
			handleEvent(w, r)
			return
		}

		if strings.HasPrefix(uri, "/api/goplay/") {
			handleGoPlayground(w, r)
			return
		}

		tryServeRedirect := func(uri string) bool {
			if uri == "/home" {
				http.Redirect(w, r, "/", http.StatusPermanentRedirect)
				return true
			}
			return false
		}
		if tryServeRedirect(uri) {
			return
		}

		if proxyHandler != nil {
			transformRequestForProxy := func() {
				uris := []string{"/github_success", "/gisteditor/nogist", "/gisteditor/edit"}
				shouldProxyURI := slices.Contains(uris, uri)
				if !shouldProxyURI {
					return
				}
				newPath := uri + ".html"
				newURI := strings.Replace(r.URL.String(), uri, newPath, 1)
				var err error
				r.URL, err = url.Parse(newURI)
				must(err)
			}

			transformRequestForProxy()
			proxyHandler.ServeHTTP(w, r)
			return
		}

		// note that path.Join("/dist/", "/") returns "/dist" so we rely
		// on TryServeFileFromURL() to serve "/dist" with "/dist/index.html" (if exists)
		urlPath := path.Join("/dist/", uri)
		logf("mainHandler: before TryServeFileFromURL urlPath: '%s', uri: '%s'\n", urlPath, uri)
		if hutil.TryServeFileFromURL(w, r, urlPath, serveOpts) {
			logf("mainHandler: served '%s' via httputil.TryServeFile\n", uri)
			return
		}

		http.NotFound(w, r)
	}

	handlerWithMetrics := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		m := httpsnoop.CaptureMetrics(http.HandlerFunc(mainHandler), w, r)
		defer func() {
			if p := recover(); p != nil {
				logf("handlerWithMetrics: panicked with with %v\n", p)
				errStr := fmt.Sprintf("Error: %v", p)
				http.Error(w, errStr, http.StatusInternalServerError)
				return
			}
			logHTTPReq(r, m.Code, m.Written, m.Duration)
			if m.Code == 200 {
				pirschSendHit(r)
			}
			axiomLogHTTPReq(ctx(), r, m.Code, int(m.Written), m.Duration)
		}()
	})

	httpSrv := &http.Server{
		ReadTimeout:  120 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  120 * time.Second,
		Handler:      http.HandlerFunc(handlerWithMetrics),
	}
	httpAddr := fmt.Sprintf(":%d", httpPort)
	if isWinOrMac() {
		httpAddr = "localhost" + httpAddr
	}
	httpSrv.Addr = httpAddr
	return httpSrv
}

func serverListenAndWait(httpSrv *http.Server) func() {
	chServerClosed := make(chan bool, 1)
	go func() {
		err := httpSrv.ListenAndServe()
		// mute error caused by Shutdown()
		if err == http.ErrServerClosed {
			err = nil
		}
		if err == nil {
			logf("HTTP server shutdown gracefully\n")
		} else {
			logf("httpSrv.ListenAndServe error '%s'\n", err)
		}
		chServerClosed <- true
	}()

	return func() {
		// Ctrl-C sends SIGINT
		sctx, stop := signal.NotifyContext(ctx(), os.Interrupt /*SIGINT*/, os.Kill /* SIGKILL */, syscall.SIGTERM)
		defer stop()
		<-sctx.Done()

		logf("Got one of the signals. Shutting down http server\n")
		_ = httpSrv.Shutdown(ctx())
		select {
		case <-chServerClosed:
			// do nothing
		case <-time.After(time.Second * 5):
			// timeout
			logf("timed out trying to shut down http server")
		}
	}
}

func mkFsys() {
	logf("mkFsys: isDev: %v, flgRunProd: %v\n", isDev(), flgRunProd)
	if flgRunProd {
		fsys = wwwFS
		logf("serving from embedded FS\n")
	} else {
		dir := "server"
		fsys = os.DirFS(dir)
		logf("serving from dir '%s'\n", dir)
	}
	printFS(fsys, "dist")
}

func runServerDev() {
	if hasBun() {
		u.RunLoggedInDir("frontend", "bun", "install")
		closeDev, err := startLoggedInDir("frontend", "bun", "run", "dev")
		must(err)
		defer closeDev()
	} else {
		u.RunLoggedInDir("frontend", "yarn")
		closeDev, err := startLoggedInDir("frontend", "yarn", "dev")
		must(err)
		defer closeDev()
	}

	mkFsys()

	proxyURL, err := url.Parse(proxyURLStr)
	must(err)
	proxyHandler := httputil.NewSingleHostReverseProxy(proxyURL)

	fsys := os.DirFS(filepath.Join("frontend", "public"))
	serveOpts := &hutil.ServeFileOptions{
		SupportCleanURLS: true,
		ForceCleanURLS:   true,
		FS:               fsys,
		//ServeCompressed:  true,
	}
	httpSrv := makeHTTPServer(serveOpts, proxyHandler)

	//closeHTTPLog := OpenHTTPLog("onlinetool")
	//defer closeHTTPLog()

	logf("runServerDev(): starting on '%s', dev: %v\n", httpSrv.Addr, isDev())
	if isWinOrMac() {
		time.Sleep(time.Second * 2)
		u.OpenBrowser("http://" + httpSrv.Addr)
	}
	waitFn := serverListenAndWait(httpSrv)
	waitFn()
}

func runServerProd() {
	mkFsys()
	checkHasEmbeddedFiles()

	serveOpts := &hutil.ServeFileOptions{
		SupportCleanURLS: true,
		ForceCleanURLS:   true,
		FS:               fsys,
		//ServeCompressed:  true,
	}
	httpSrv := makeHTTPServer(serveOpts, nil)
	logf("runServerProd(): starting on 'http://%s', dev: %v, prod: %v, prod local: %v\n", httpSrv.Addr, flgRunDev, flgRunProd, flgRunProdLocal)
	if isWinOrMac() {
		time.Sleep(time.Second * 2)
		u.OpenBrowser("http://" + httpSrv.Addr)
	}
	waitFn := serverListenAndWait(httpSrv)
	waitFn()
}

func runServerProdLocal() {
	runServerProd()
}

func runServerProdLocalStart() {
	exeName := buildForProdLocal()
	defer emptyFrontEndBuildDir()

	cmd := exec.Command("./"+exeName, "-run-prod-local-2")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	logf("starting '%s'\n", cmd.String())
	err := cmd.Start()
	must(err)

	waitForSigIntOrKill()
	cmd.Process.Kill()
	logf("leaving from -run-prod-local\n")
}
