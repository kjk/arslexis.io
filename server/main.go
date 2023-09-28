package main

import (
	"flag"
	"os"
	"os/exec"
	"time"
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
}

var (
	flgRunDev bool
)

func isDev() bool {
	return flgRunDev
}

func main() {
	var (
		flgRunProd        bool
		flgCi             bool
		flgWc             bool
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
		flag.BoolVar(&flgCi, "ci", false, "true if needs to tell we're running under ci (github actions)")
		flag.BoolVar(&flgWc, "wc", false, "count lines")
		flag.Parse()
	}

	getSecretsFromEnv()

	setGitHubAuth()
	if isDev() {
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
		logf(ctx(), "took: %s\n", time.Since(timeStart))
	}()

	if flgWc {
		doLineCount()
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

	/*
		if flgBuild {
			build()
			buildDocs()
			return
		}
	*/

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

func build() {
	cmd := exec.Command("yarn", "build", "--emptyOutDir")
	cmdLog(cmd)
	must(cmd.Run())
}

func buildDocs() {
	cmd := exec.Command("yarn", "docs:build")
	cmdLog(cmd)
	must(cmd.Run())
}
