package main

import (
	"flag"
	"os"
	"strings"
	"time"

	"github.com/kjk/common/u"
)

var (
	// for github login when running on localhost
	secretGitHubLocal = ""
	// for github login when running on onlinetool.io
	secretGitHubOnlineTool = ""
	// for github login when running on tools.arslexis.io
	secretGitHubToolsArslexis = ""
)

// minimum amount of secrets that allows for running in dev mode
// if some secrets are missing, the related functionality will be disabled
// (e.g. sending mails or github loging)
// you can put your own secrets here
const secretsDev = `# secrets for dev mode
# COOKIE_AUTH_KEY=baa18ad1db89a7e9fbb50638815be63150a4494ac465779ee2f30bc980f1a55e
# COOKIE_ENCR_KEY=2780ffc17eec2d85960473c407ee37c0249db93e4586ec52e3ef9e153ba61e72
AXIOM_TOKEN=
PIRSCH_SECRET=
GITHUB_SECRET_ONLINETOOL=
GITHUB_SECRET_TOOLS_ARSLEXIS=
GITHUB_SECRET_LOCAL=
MAILGUN_DOMAIN=
MAILGUN_API_KEY=
`

// in production deployment secrets are stored in binary as secretsEnv
// when running non-prod we read secrets from secrets repo we assume
// is parallel to this repo
func loadSecrets() {
	d := secretsEnv
	if len(secretsEnv) == 0 {
		// secrets not embedded in the binary
		// load from ../secrets/onlinetool.env or minimum from secretsDev
		panicIf(flgRunProd, "when running in production must have secrets embedded in the binary")
		var err error
		d, err = os.ReadFile(secretsSrcPath)
		if err == nil {
			logf("loadSecrets(): using secrets from %s\n", secretsSrcPath)
		} else {
			// it's ok, those files are secret and only exist on my laptop
			// this could be ran by someone else or by me on codespaces/gitpod etc.
			// we default to minimum amount of secrets from secretsDev
			d = []byte(secretsDev)
			logf("loadSecrets(): using minimal dev secrets from secretsDev\n")
		}
	} else {
		logf("using embedded secrets of lenght %d\n", len(secretsEnv))
	}
	m := u.ParseEnvMust(d)
	getEnv := func(key string, val *string, minLen int, must bool) {
		v := strings.TrimSpace(m[key])
		if len(v) < minLen {
			panicIf(must, "missing %s, len: %d, wanted: %d\n", key, len(v), minLen)
			logf("missing %s, len: %d, wanted: %d\n", key, len(v), minLen)
			return
		}
		*val = v
		if isDev() {
			logf("Got %s='%s'\n", key, v)
		} else {
			logf("Got %s\n", key)
		}
	}
	// those we need always
	must := true
	// getEnv("COOKIE_AUTH_KEY", &cookieAuthKeyHex, 64, must)
	// getEnv("COOKIE_ENCR_KEY", &cookieEncrKeyHex, 64, must)

	// those are only required in prod
	must = flgRunProd
	getEnv("AXIOM_TOKEN", &axiomApiToken, 40, must)
	getEnv("PIRSCH_SECRET", &pirschClientSecret, 64, must)
	getEnv("GITHUB_SECRET_ONLINETOOL", &secretGitHubOnlineTool, 40, must)
	getEnv("GITHUB_SECRET_TOOLS_ARSLEXIS", &secretGitHubToolsArslexis, 40, must)
	getEnv("GITHUB_SECRET_LOCAL", &secretGitHubLocal, 40, must)
	getEnv("MAILGUN_DOMAIN", &mailgunDomain, 4, must)
	getEnv("MAILGUN_API_KEY", &mailgunAPIKey, 32, must)

	// when running locally we shouldn't send axiom / pirsch
	if isDev() || flgRunProdLocal {
		panicIf(axiomApiToken != "")
		panicIf(pirschClientSecret != "")
	}
}

var (
	// assets being served on-demand by vite
	flgRunDev bool
	// compiled assets embedded in the binary
	flgRunProd bool
	// compiled assets served from server/dist directory
	// mostly for testing that the assets are correctly built
	flgRunProdLocal bool
)

func isDev() bool {
	return flgRunDev
}

func measureDuration() func() {
	timeStart := time.Now()
	return func() {
		logf("took %s\n", time.Since(timeStart))
	}
}

func main() {
	var (
		flgDeployHetzner  bool
		flgSetupAndRun    bool
		flgBuildLocalProd bool
		flgUpdateGoDeps   bool
	)
	{
		flag.BoolVar(&flgRunDev, "run-dev", false, "run the server in dev mode")
		flag.BoolVar(&flgRunProd, "run-prod", false, "run server in production")
		flag.BoolVar(&flgRunProdLocal, "run-prod-local", false, "run server in production but locally")
		flag.BoolVar(&flgDeployHetzner, "deploy-hetzner", false, "deploy to hetzner")
		flag.BoolVar(&flgBuildLocalProd, "build-local-prod", false, "build for production run locally")
		flag.BoolVar(&flgSetupAndRun, "setup-and-run", false, "setup and run on the server")
		flag.BoolVar(&flgUpdateGoDeps, "update-go-deps", false, "update go dependencies")
		flag.Parse()
	}

	if GitCommitHash != "" {
		uriBase := "https://github.com/kjk/sendmeafile/commit/"
		logf("onlinetool.io, build: %s (%s)\n", GitCommitHash, uriBase+GitCommitHash)
	}

	if flgUpdateGoDeps {
		defer measureDuration()()
		updateGoDeps(true)
		return
	}

	if flgBuildLocalProd {
		defer measureDuration()()
		buildForProdLocal()
		emptyFrontEndBuildDir()
		return
	}

	if flgDeployHetzner {
		defer measureDuration()()
		deployToHetzner()
		return
	}

	if flgSetupAndRun {
		defer measureDuration()()
		setupAndRun()
		return
	}

	n := 0
	if flgRunDev {
		n++
	}
	if flgRunProdLocal {
		n++
	}
	if flgRunProd {
		n++
	}
	if n == 0 {
		flag.Usage()
		return
	}
	panicIf(n > 1, "can only use one of: -run-dev, -run-prod, -run-prod-local")

	loadSecrets()

	if flgRunDev {
		runServerDev()
		return
	}

	if flgRunProd {
		runServerProd()
		return
	}

	if flgRunProdLocal {
		runServerProdLocal()
		return
	}

	flag.Usage()
}
