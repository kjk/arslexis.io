package main

import (
	"flag"
	"os"
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
	if len(secretsEnv) > 0 {
		logf("loading secrets from secretsEnv\n")
		m = u.ParseEnvMust(secretsEnv)
	} else {
		panicIf(!isWinOrMac(), "secretsEnv is empty and running on linux")
		d, err := os.ReadFile(secretsSrcPath)
		must(err)
		m = u.ParseEnvMust(d)
	}
	validateSecrets(m)
	axiomApiToken = m["AXIOM_TOKEN"]
	if len(axiomApiToken) != 41 {
		logf("Axiom token missing or invalid length\n")
		axiomApiToken = ""
	} else {
		logf("Got axiom token\n")
	}
	pirschClientSecret = m["PIRSCH_SECRET"]
	if len(pirschClientSecret) != 64 {
		logf("Pirsch secret missing or invalid length\n")
		pirschClientSecret = ""
	} else {
		logf("Got pirsch token\n")
	}
	secretGitHub = m["GITHUB_SECRET_PROD"]
	if len(secretGitHub) != 40 {
		logf("GitHub secret missing or invalid length\n")
		secretGitHub = ""
	} else {
		logf("Got GitHub secret\n")
	}
	secretGitHubLocal = m["GITHUB_SECRET_LOCAL"]
	if len(secretGitHubLocal) != 40 {
		logf("GitHub Local secret missing or invalid length\n")
		secretGitHubLocal = ""
	} else {
		logf("Got GitHub local secret\n")
	}

	// when running locally don't do some things
	if isWinOrMac() {
		logf("running in dev, clearing axiom and pirsch\n")
		axiomApiToken = ""
		pirschClientSecret = ""
	}
}

var (
	flgRunDev bool
)

func isDev() bool {
	return flgRunDev
}

func main() {
	var (
		flgRunProd         bool
		flgDeployHetzner   bool
		flgSetupAndRun     bool
		flgBuildLocalProd  bool
		flgExtractFrontend bool
	)
	{
		flag.BoolVar(&flgRunDev, "run-dev", false, "run the server in dev mode")
		flag.BoolVar(&flgRunProd, "run-prod", false, "run server in production")
		flag.BoolVar(&flgDeployHetzner, "deploy-hetzner", false, "deploy to hetzner")
		flag.BoolVar(&flgBuildLocalProd, "build-local-prod", false, "build for production run locally")
		flag.BoolVar(&flgSetupAndRun, "setup-and-run", false, "setup and run on the server")
		flag.BoolVar(&flgExtractFrontend, "extract-frontend", false, "extract frontend files embedded as zip in the binary")
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

	if flgExtractFrontend {
		extractFrontend()
		return
	}

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
