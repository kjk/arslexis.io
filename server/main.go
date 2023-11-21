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
	if len(secretsEnv) > 20 {
		logf("loading secrets from secretsEnv\n")
		m = u.ParseEnvMust(secretsEnv)
	} else {
		panicIf(!isWinOrMac(), "secretsEnv is empty and running on linux")
		d, err := os.ReadFile(secretsSrcPath)
		must(err)
		m = u.ParseEnvMust(d)
	}
	validateSecrets(m)
	getEnv := func(key string, val *string, minLen int) {
		v := strings.TrimSpace(m[key])
		if len(v) < minLen {
			logf("missing %s, len: %d, wanted: %d\n", key, len(v), minLen)
			return
		}
		*val = v
		// logf("Got %s, '%s'\n", key, v)
		logf("Got %s\n", key)
	}

	getEnv("AXIOM_TOKEN", &axiomApiToken, 40)
	getEnv("PIRSCH_SECRET", &pirschClientSecret, 64)
	getEnv("GITHUB_SECRET_PROD", &secretGitHub, 40)
	getEnv("GITHUB_SECRET_LOCAL", &secretGitHubLocal, 40)
	getEnv("MAILGUN_DOMAIN", &mailgunDomain, 4)
	getEnv("MAILGUN_API_KEY", &mailgunAPIKey, 32)

	// when running locally don't do some things
	if isWinOrMac() {
		logf("running in dev, clearing axiom and pirsch\n")
		axiomApiToken = ""
		pirschClientSecret = ""
	}
}

var (
	flgRunDev  bool
	flgRunProd bool
)

// TODO: edit usage
func isDev() bool {
	return flgRunDev
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
		flag.BoolVar(&flgDeployHetzner, "deploy-hetzner", false, "deploy to hetzner")
		flag.BoolVar(&flgBuildLocalProd, "build-local-prod", false, "build for production run locally")
		flag.BoolVar(&flgSetupAndRun, "setup-and-run", false, "setup and run on the server")
		flag.Parse()
	}

	loadSecrets()

	setGitHubAuth()
	if isWinOrMac() {
		setGitHubAuthDev()
	}

	if flgRunDev {
		runServerDev()
		return
	}

	if flgRunProd {
		runServerProd()
		return
	}
	timeStart := time.Now()
	defer func() {
		logf("took: %s\n", time.Since(timeStart))
	}()

	if flgBuildLocalProd {
		buildLocalProd()
		return
	}

	if flgDeployHetzner {
		deployToHetzner()
		return
	}

	if flgSetupAndRun {
		setupAndRun()
		return
	}

	flag.Usage()
}
