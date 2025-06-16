package server

import (
	"flag"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/kjk/common/logtastic"
	"github.com/kjk/common/u"
)

var (
	// for github login when running on localhost
	secretGitHubLocal = ""
	// for github login when running on arslexis.io
	secretGitHubToolsArslexis = ""

	dataDirCached string
)

// minimum amount of secrets that allows for running in dev mode
// if some secrets are missing, the related functionality will be disabled
// (e.g. sending mails or github loging)
// you can put your own secrets here
const secretsDev = `# secrets for dev mode
# COOKIE_AUTH_KEY=baa18ad1db89a7e9fbb50638815be63150a4494ac465779ee2f30bc980f1a55e
# COOKIE_ENCR_KEY=2780ffc17eec2d85960473c407ee37c0249db93e4586ec52e3ef9e153ba61e72
GITHUB_SECRET_TOOLS_ARSLEXIS=
GITHUB_SECRET_LOCAL=
MAILGUN_DOMAIN=
MAILGUN_API_KEY=
`

func getSecrets() []byte {
	// in production deployment secrets are embedded in binary as secretsEnv
	if len(secretsEnv) > 0 {
		logf("getSecrets(): using secrets from embedded secretsEnv of length %d\n", len(secretsEnv))
		return secretsEnv
	}
	panicIf(flgRunProd, "when running in production must have secrets embedded in the binary")

	// when running non-prod we try to read secrets from secrets repo
	// secrets file only exists on my laptop so it's ok if read fails
	// this could be because someone else is running or me on codespaces/gitpod etc.
	d, err := os.ReadFile(secretsSrcPath)
	if err == nil && len(d) > 0 {
		logf("getSecrets(): using secrets from %s of size %d\n", secretsSrcPath, len(d))
		return d
	}
	// we fallback to minimum amount of secrets from secretsDev
	logf("getSecrets(): using minimal dev secrets from secretsDev of length %d\n", len(secretsDev))
	return []byte(secretsDev)
}

func loadSecrets() {
	d := getSecrets()
	m := u.ParseEnvMust(d)
	logf("loadSecret: got %d secrets\n", len(m))
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
	getEnv("GITHUB_SECRET_TOOLS_ARSLEXIS", &secretGitHubToolsArslexis, 40, must)
	getEnv("GITHUB_SECRET_LOCAL", &secretGitHubLocal, 40, must)
	getEnv("MAILGUN_DOMAIN", &mailgunDomain, 4, must)
	getEnv("MAILGUN_API_KEY", &mailgunAPIKey, 32, must)
	getEnv("LOGTASTIC_API_KEY", &logtastic.ApiKey, 30, must)

}

func getDataDirMust() string {
	if dataDirCached != "" {
		return dataDirCached
	}
	dataDirCached = "data"
	if flgRunProd {
		dataDirCached = "/home/data/" + projectName
	}
	must(os.MkdirAll(dataDirCached, 0755))
	return dataDirCached
}

func getLogsDirMust() string {
	res := filepath.Join(getDataDirMust(), "logs")
	err := os.MkdirAll(res, 0755)
	must(err)
	return res
}

var (
	// assets being served on-demand by vite
	flgRunDev bool
	// compiled assets embedded in the binary
	flgRunProd bool
)

func isDev() bool {
	return flgRunDev
}

func Main() {
	var (
		flgDeployHetzner bool
		flgSetupAndRun   bool
		flgUpdateGoDeps  bool
		flgTest          bool
		flgTestRunProd   bool
	)
	{
		flag.BoolVar(&flgRunDev, "run-dev", false, "run the server in dev mode")
		flag.BoolVar(&flgRunProd, "run-prod", false, "run server in production")
		flag.BoolVar(&flgTestRunProd, "test-run-prod", false, "build production version, run locally, to test production build")
		flag.BoolVar(&flgDeployHetzner, "deploy-hetzner", false, "deploy to hetzner")
		flag.BoolVar(&flgSetupAndRun, "setup-and-run", false, "setup and run on the server")
		flag.BoolVar(&flgUpdateGoDeps, "update-go-deps", false, "update go dependencies")
		flag.BoolVar(&flgTest, "test", false, "run go and js tests")
		flag.Parse()
	}

	if GitCommitHash != "" {
		uriBase := "https://github.com/kjk/tools.arslexis.io/commit/"
		logf("arslexis.io, build: %s (%s)\n", GitCommitHash, uriBase+GitCommitHash)
	}

	if flgUpdateGoDeps {
		defer measureDuration()()
		u.UpdateGoDeps(".", true)
		return
	}

	if false {
		clean()
		return
	}

	if false {
		defer measureDuration()()
		buildForProdLocal()
		return
	}

	if flgTest {
		{
			cmd := exec.Command("bun", "test")
			must(runLogged(cmd))
		}
		{
			cmd := exec.Command("go", "test", ".")
			must(runLogged(cmd))
		}
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

	if flgTestRunProd {
		testRunServerProd()
		return
	}

	n := 0
	if flgRunDev {
		n++
	}
	if flgRunProd {
		n++
	}
	if n == 0 {
		flag.Usage()
		return
	}
	panicIf(n > 1, "can only use one of: -run-dev, -run-prod, -run-local-prod")

	loadSecrets()

	logtastic.BuildHash = GitCommitHash
	logtastic.LogDir = getLogsDirMust()
	if flgRunProd && !isWinOrMac() {
		logtastic.Server = "l.arslexis.io"
	} else {
		logtastic.Server = "127.0.0.1:9327"
	}
	logf("logtatistic server: %s\n", logtastic.Server)

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
