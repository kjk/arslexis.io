package main

import (
	"flag"
	"os"
	"strings"
	"time"

	"github.com/kjk/common/u"
)

var (
	// for github login when deployed to online.io
	secretGitHub = ""
	// for github login when running on localhost
	secretGitHubLocal = ""
)

// in production deployment secrets are stored in binary as secretsEnv
// when running non-prod we read secrets from secrets repo we assume
// is parallel to this repo
func loadSecrets() {
	var m map[string]string
	var err error
	d := secretsEnv
	if isDev() {
		logf("loadSecrets(): loading dev secrets from secretsDev\n")
		d = []byte(secretsDev)
	} else {
		if flgRunProdLocal {
			logf("loadSecrets(): loading prod secrets from '%s'\n", secretsSrcPath)
			d, err = os.ReadFile(secretsSrcPath)
			must(err)
		} else {
			// using default secretsEnv
			panicIf(len(secretsEnv) == 0, "-run-prod and secretsEnv is empty")
			logf("loadSecrets(): loading prod secrets from secretsEnv\n")
		}
	}
	m = u.ParseEnvMust(d)

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
	// those we want in prod and dev
	must := true
	// getEnv("COOKIE_AUTH_KEY", &cookieAuthKeyHex, 64, must)
	// getEnv("COOKIE_ENCR_KEY", &cookieEncrKeyHex, 64, must)

	// those are only required in prod
	must = isProd()
	getEnv("AXIOM_TOKEN", &axiomApiToken, 40, must)
	getEnv("PIRSCH_SECRET", &pirschClientSecret, 64, must)
	getEnv("GITHUB_SECRET_PROD", &secretGitHub, 40, must)
	getEnv("GITHUB_SECRET_LOCAL", &secretGitHubLocal, 40, must)
	getEnv("MAILGUN_DOMAIN", &mailgunDomain, 4, must)
	getEnv("MAILGUN_API_KEY", &mailgunAPIKey, 32, must)

	// when running locally we shouldn't send axiom / pirsch
	if isDev() {
		panicIf(axiomApiToken != "")
		panicIf(pirschClientSecret != "")
	}
}

var (
	flgRunDev       bool
	flgRunProd      bool
	flgRunProdLocal bool
)

// TODO: edit usage
func isDev() bool {
	return flgRunDev
}

// TODO: edit usage, should we only use isDeployment() ?
func isProd() bool {
	return flgRunProd
}

// return true is running deployment i.e. production on linux server
func isDeployment() bool {
	// TODO: a stricter check but not sure what. needs to di
	return flgRunProd
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
	)
	{
		flag.BoolVar(&flgRunDev, "run-dev", false, "run the server in dev mode")
		flag.BoolVar(&flgRunProd, "run-prod", false, "run server in production")
		flag.BoolVar(&flgRunProdLocal, "run-prod-local", false, "run server in production but locally")
		flag.BoolVar(&flgDeployHetzner, "deploy-hetzner", false, "deploy to hetzner")
		flag.BoolVar(&flgBuildLocalProd, "build-local-prod", false, "build for production run locally")
		flag.BoolVar(&flgSetupAndRun, "setup-and-run", false, "setup and run on the server")
		flag.Parse()
	}

	if GitCommitHash != "" {
		uriBase := "https://github.com/kjk/sendmeafile/commit/"
		logf("onlinetool.io, build: %s (%s)\n", GitCommitHash, uriBase+GitCommitHash)
	}

	if flgBuildLocalProd {
		defer measureDuration()()
		buildLocalProd()
		return
	}

	if flgDeployHetzner {
		defer measureDuration()()
		deployToHetzner()
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

	setGitHubAuth()

	if flgRunDev {
		runServerDev()
		return
	}

	if flgRunProd {
		runServerProd()
		return
	}

	if flgSetupAndRun {
		setupAndRun()
		return
	}

	flag.Usage()
}
