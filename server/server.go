package server

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
	"strings"
	"syscall"
	"time"

	"github.com/felixge/httpsnoop"
	hutil "github.com/kjk/common/httputil"
	"github.com/kjk/common/logtastic"

	"github.com/google/go-github/github"
	"github.com/kjk/common/u"
	"golang.org/x/exp/slices"
	"golang.org/x/oauth2"
)

var (
	DistFS embed.FS
	//go:embed secrets.env
	secretsEnv []byte
)

var (
	// must be same as vite.config.js
	proxyURLStr = "http://localhost:3025"
)

var (
	// random string for oauth2 API calls to protect against CSRF
	oauthSecretPrefix = "3212431324-"
	gitHubEndpoint    = oauth2.Endpoint{
		AuthURL:  "https://github.com/login/oauth/authorize",
		TokenURL: "https://github.com/login/oauth/access_token",
	}
	githubConfig = oauth2.Config{
		ClientID:     "",
		ClientSecret: "",
		// select level of access you want https://developer.github.com/v3/oauth/#scopes
		Scopes:   []string{"user:email", "read:user", "gist"},
		Endpoint: gitHubEndpoint,
	}
)

func getGithubConfig(r *http.Request) *oauth2.Config {
	logf("getGithubConfig: r.Host: '%s'\n", r.Host)
	host := strings.ToLower(r.Host)
	if githubConfig.ClientID == "" {
		// we need to register a GitHub app for each callback domain
		if strings.Contains(host, "localhost") {
			// https://github.com/settings/applications/1159176 : localhost
			githubConfig.ClientID = "77ba1cbe7c0eff7c462b"
			githubConfig.ClientSecret = secretGitHubLocal
			logf("getGithubConfig: using localhost config\n")
		} else if strings.Contains(host, "arslexis.io") {
			// https://github.com/settings/applications/2495749 : arslexis.io
			githubConfig.ClientID = "ff6bcecdb5df037a208d"
			githubConfig.ClientSecret = secretGitHubToolsArslexis
			logf("getGithubConfig: using arslexis.io config\n")
		} else {
			panicIf(true, "unsupported host: %s", host)
		}
	}
	return &githubConfig
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
	m := map[string]any{
		"name": "github_login",
	}
	if user.Login != nil {
		m["user"] = *user.Login
	}
	if user.Email != nil {
		m["email"] = *user.Email
	}
	if user.Name != nil {
		m["name"] = *user.Name
	}
	logtastic.LogEvent(r, m)
}

// /auth/ghlogin
func handleLoginGitHub(w http.ResponseWriter, r *http.Request) {
	conf := getGithubConfig(r)
	if conf.ClientID == "" {
		serveInternalError(w, e("missing github client id"))
		return
	}
	if conf.ClientSecret == "" {
		serveInternalError(w, e("missing github client secret"))
		return
	}
	uri := conf.AuthCodeURL(oauthSecretPrefix, oauth2.AccessTypeOnline)
	logf("handleLoginGitHub: redirect to '%s'\n", uri)
	tempRedirect(w, r, uri)
}

// /auth/githubcb
func handleGithubCallback(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	logf("handleGithubCallback: '%s'\n", r.URL)
	state := r.FormValue("state")
	if !strings.HasPrefix(state, oauthSecretPrefix) {
		logErrorf("invalid oauth state, expected '%s*', got '%s'\n", oauthSecretPrefix, state)
		tempRedirect(w, r, "/")
		return
	}

	code := r.FormValue("code")
	conf := getGithubConfig(r)
	token, err := conf.Exchange(context.Background(), code)
	if err != nil {
		logErrorf("oauthGoogleConf.Exchange() failed with '%s'\n", err)
		tempRedirect(w, r, "/")
		return
	}
	logf("token: %#v", token)
	ac := token.AccessToken
	uri := "/github_success?access_token=" + ac
	logf("token: %#v\nuri: %s\n", token, uri)
	tempRedirect(w, r, uri)

	// can't put in the background because that cancels ctx
	logLogin(ctx, r, token)
}

// in dev, proxyHandler redirects assets to vite web server
// in prod, assets must be pre-built in frontend/dist directory
func makeHTTPServer(serveOpts *hutil.ServeFileOptions, proxyHandler *httputil.ReverseProxy) *http.Server {
	panicIf(serveOpts == nil, "must provide serveOpts")

	mainHandler := func(w http.ResponseWriter, r *http.Request) {
		uri := r.URL.Path
		logf("mainHandler: '%s'\n", r.RequestURI)

		switch uri {
		case "/ping", "/ping.txt":
			content := bytes.NewReader([]byte("pong"))
			http.ServeContent(w, r, ".txt", time.Time{}, content)
			return
		case "/auth/ghlogin":
			handleLoginGitHub(w, r)
			return
		case "/auth/githubcb":
			handleGithubCallback(w, r)
			return
		}

		if uri == "/event" {
			logf("mainHandler: Logging event\n")
			logtastic.HandleEvent(w, r)
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

		if hutil.TryServeURLFromFS(w, r, serveOpts) {
			logf("mainHandler: served '%s' via httputil.TryServeURLFromFS\n", uri)
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
			logtastic.LogHit(r, m.Code, m.Written, m.Duration)
			logHTTPReq(r, m.Code, m.Written, m.Duration)
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

func waitForServerReadyMust(uri string) {
	logf("waitForServerReady: waiting for '%s' to be ready\n", uri)
	for i := 0; i < 10; i++ {
		resp, err := http.Get(uri)
		if err == nil && resp.StatusCode == http.StatusOK {
			logf("waitForServerReady: got response from '%s'\n", uri)
			resp.Body.Close()
			return
		}
		logf("waitForServerReady: failed to get response from '%s', error: %v\n", uri, err)
		time.Sleep(time.Second * 1)
	}
	panicIf(true, "failed to get response from '%s'", uri)
}

func openBrowserForServer(httpSrv *http.Server) {
	// wait for go server
	waitForServerReadyMust("http://" + httpSrv.Addr + "/ping.txt")
	if flgRunDev {
		// wait for vite dev server
		waitForServerReadyMust(proxyURLStr + "/")
	}
	u.OpenBrowser("http://" + httpSrv.Addr)
}

func serverListen(httpSrv *http.Server) func() {
	logf("serverListenAndWait: listening on '%s', isDevOrLocal: %v\n", httpSrv.Addr, isDevOrLocal())

	chServerClosed := make(chan bool, 1)
	go func() {
		err := httpSrv.ListenAndServe()
		// mute error caused by Shutdown()
		if err == nil || err == http.ErrServerClosed {
			logf("HTTP server shutdown gracefully\n")
		} else {
			logf("httpSrv.ListenAndServe error '%s'\n", err)
		}
		chServerClosed <- true
	}()

	return func() {
		sctx, stop := signal.NotifyContext(ctx(), os.Interrupt /*SIGINT*/, os.Kill /* SIGKILL */, syscall.SIGTERM)
		defer stop()

		select {
		case <-sctx.Done():
			logf("Got Ctrl+C stop signal. Shutting down http server\n")
			_ = httpSrv.Shutdown(ctx())
		case <-chServerClosed:
			logf("server stopped")
			return
		}

		// got ctrl-c signal, wait for server to close
		select {
		case <-chServerClosed:
			// do nothing
		case <-time.After(time.Second * 5):
			// timeout
			logf("timed out trying to shut down http server")
		}
	}
}

func startLogtastic() {
	logtastic.BuildHash = GitCommitHash
	logtastic.LogDir = getLogsDirMust()
	if flgRunProd && !isWinOrMac() {
		logtastic.Server = "l.arslexis.io"
	} else {
		logtastic.Server = "127.0.0.1:9327"
	}
	logf("logtatistic server: %s\n", logtastic.Server)
}

func mkFsysEmbedded() fs.FS {
	fsys := DistFS
	printFS(fsys, "dist")
	logf("mkFsysEmbedded: serving from embedded FS\n")
	return fsys
}

func mkFsysDirPublic() fs.FS {
	dir := "public"
	fsys := os.DirFS(dir)
	printFS(fsys, ".")
	logf("mkFsysDirPublic: serving from dir '%s'\n", dir)
	return fsys
}

func mkServeFileOptions(fsys fs.FS) *hutil.ServeFileOptions {
	return &hutil.ServeFileOptions{
		SupportCleanURLS:     true,
		ForceCleanURLS:       true,
		FS:                   fsys,
		DirPrefix:            "dist/",
		LongLivedURLPrefixes: []string{"/assets/"},
		//ServeCompressed:  true,
	}
}

func runServerDev() {
	cmd := exec.Command("bun", "install")
	must(runLogged(cmd))
	closeDev, err := startLoggedInDir(".", "bun", "run", "dev")
	must(err)
	defer closeDev()

	// startLogtastic()

	proxyURL, err := url.Parse(proxyURLStr)
	must(err)
	proxyHandler := httputil.NewSingleHostReverseProxy(proxyURL)

	fsys := mkFsysDirPublic()
	serveOpts := mkServeFileOptions(fsys)
	httpSrv := makeHTTPServer(serveOpts, proxyHandler)

	//closeHTTPLog := OpenHTTPLog("onlinetool")
	//defer closeHTTPLog()

	logf("runServerDev(): starting on '%s', isDevOrLocal: %v\n", httpSrv.Addr, isDevOrLocal())
	waitFn := serverListen(httpSrv)
	openBrowserForServer(httpSrv)
	waitFn()
}

func runServerProd() {
	testingProd := isWinOrMac()

	fsys := mkFsysEmbedded()
	checkHasEmbeddedFilesMust()

	if !testingProd {
		startLogtastic()
	}
	serveOpts := mkServeFileOptions(fsys)
	httpSrv := makeHTTPServer(serveOpts, nil)
	logf("runServerProd(): starting on 'http://%s', dev: %v, prod: %v, testingProd: %v\n", httpSrv.Addr, flgRunDev, flgRunProd, testingProd)

	waitFn := serverListen(httpSrv)
	if testingProd {
		openBrowserForServer(httpSrv)
	}
	waitFn()
}

func runServerProdLocal() {
	if !isWinOrMac() {
		logf("testRunServerProd: not running on Windows or Mac, skipping\n")
		return
	}
	logf("runServerProdLocal\n")
	exeName := buildForProdLocal()
	cmd := exec.Command("./"+exeName, "-run-prod")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Start()
	must(err)
	u.WaitForSigIntOrKill()
	if cmd.ProcessState != nil && cmd.ProcessState.Exited() {
		logf("runServerProdLocal: cmd already exited\n")
	} else {
		logf("runServerProdLocal: killing cmd\n")
		err = cmd.Process.Kill()
		must(err)
	}
	logf("runServerProdLocal: cmd killed\n")
}
