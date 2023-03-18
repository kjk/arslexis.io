package main

import (
	"flag"
	"os"
	"os/exec"
	"strings"

	"github.com/kjk/common/httputil"
)

var (
	secretGitHub      = ""
	secretGitHubLocal = ""
)

func getSecretsFromEnv() {
	axiomApiToken = os.Getenv("ONLINETOOL_AXIOM_TOKEN")
	if len(axiomApiToken) != 41 {
		logf(ctx(), "Axiom token missing or invalid length\n")
		axiomApiToken = ""
	} else {
		logf(ctx(), "Got axiom token\n")
	}
	pirschClientSecret = os.Getenv("ONLINETOOL_PIRSCH_SECRET")
	if len(pirschClientSecret) != 64 {
		logf(ctx(), "Pirsch secret missing or invalid length\n")
		pirschClientSecret = ""
	} else {
		logf(ctx(), "Got pirsch token\n")
	}
	secretGitHub = os.Getenv("ONLINETOOL_GITHUB_SECRET")
	if len(secretGitHub) != 40 {
		logf(ctx(), "GitHub secret missing or invalid length\n")
		secretGitHub = ""
	} else {
		logf(ctx(), "Got GitHub secret\n")
	}
	secretGitHubLocal = os.Getenv("ONLINETOOL_GITHUB_SECRET_LOCAL")
	if len(secretGitHubLocal) != 40 {
		logf(ctx(), "GitHub Local secret missing or invalid length\n")
		secretGitHubLocal = ""
	} else {
		logf(ctx(), "Got GitHub local secret\n")
	}

	renderDeployURL = os.Getenv("ONLINETOOL_DEPLOY_URL")
	if !strings.HasPrefix(renderDeployURL, "https://") {
		logf(ctx(), "No render deploy URL\n")
		renderDeployURL = ""
	} else {
		logf(ctx(), "Got render deploy URL\n")
	}
}

func main() {
	var (
		flgRunDev  bool
		flgRunProd bool
		flgDeploy  bool
		flgBuild   bool
		flgCi      bool
		flgWc      bool
	)
	{
		flag.BoolVar(&flgRunDev, "run-dev", false, "run the server in dev mode")
		flag.BoolVar(&flgRunProd, "run-prod", false, "run server in production")
		flag.BoolVar(&flgDeploy, "deploy", false, "start deploy on render.com")
		flag.BoolVar(&flgBuild, "build", false, "run yarn build to build frontend")
		flag.BoolVar(&flgCi, "ci", false, "true if needs to tell we're running under ci (github actions)")
		flag.BoolVar(&flgWc, "wc", false, "count lines")
		flag.Parse()
	}

	getSecretsFromEnv()

	setGitHubAuth()
	if isDev() {
		setGitHubAuthDev()
	}

	if flgWc {
		doLineCount()
		return
	}

	if flgBuild {
		build()
		return
	}

	if flgDeploy {
		deploy()
		return
	}

	if flgRunDev {
		runServerDev()
		return
	}

	if flgRunProd {
		runServerProd()
		return
	}

	flag.Usage()
}

func startVite() func() {
	cmd := exec.Command("npx", "vite", "--strictPort=true", "--clearScreen=false")
	logf(ctx(), "> %s\n", cmd)
	cmdLog(cmd)
	err := cmd.Start()
	must(err)
	return func() {
		cmd.Process.Kill()
	}
}

var (
	renderDeployURL string
)

func deploy() {
	if renderDeployURL == "" {
		logf(ctx(), "can't deploy because renderDeployURL not set\n")
		return
	}
	d, err := httputil.Get(renderDeployURL)
	must(err)
	logf(ctx(), "deploy result: %s\n", string(d))
}

func build() {
	cmd := exec.Command("yarn", "build", "--emptyOutDir")
	cmdLog(cmd)
	must(cmd.Run())
}
