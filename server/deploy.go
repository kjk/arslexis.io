package main

import (
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/kjk/common/u"
	"github.com/melbahja/goph"
	"github.com/pkg/sftp"
)

// variables to customize
var (
	exeBaseName      = "onlinetool"
	domain           = "onlinetool.io"
	httpPort         = 9301
	wantedSecrets    = []string{"AXIOM_TOKEN", "PIRSCH_SECRET", "GITHUB_SECRET_PROD", "GITHUB_SECRET_LOCAL"}
	frontEndBuildDir = filepath.Join("frontend", "dist")
)

// stuff that is derived from the above
var (
	secretsSrcPath  = filepath.Join("..", "secrets", exeBaseName+".env")
	frontendZipName = filepath.Join("server", "frontend.zip")

	tmuxSessionName             = exeBaseName
	deployServerDir             = "/root/apps/" + exeBaseName
	deployServerUser            = "root"
	deployServerIP              = "138.201.51.123"
	deployServerPrivateKeyPath  = "~/.ssh/hetzner_ed"
	deployServerCaddyConfigPath = "/etc/caddy/Caddyfile"

	caddyConfigDelim = "# ---- " + domain
	caddyConfig      = fmt.Sprintf(`%s {
	reverse_proxy localhost:%v
}`, domain, httpPort)

	systemdRunScriptPath = path.Join(deployServerDir, "systemd-run.sh")

	systemdRunScriptTmpl = `#!/bin/bash
tmux new-session -d -s {sessionName}
tmux send-keys -t {sessionName} "cd {workdDir}" Enter
tmux send-keys -t {sessionName} "./{exeName} -run-prod" Enter
echo "finished running under tmux"
`

	systemdService = fmt.Sprintf(`[Unit]
Description=%s
After=network.target

[Service]
ExecStart=%s
Type=oneshot
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
`, domain, systemdRunScriptPath)

	systemdServicePath     = path.Join(deployServerDir, exeBaseName+".service")
	systemdServicePathLink = fmt.Sprintf("/etc/systemd/system/%s.service", exeBaseName)
)

func writeFileMust(path string, s string, perm fs.FileMode) {
	err := os.WriteFile(path, []byte(s), perm)
	panicIf(err != nil, "os.WriteFile(%s) failed with '%s'", path, err)
	logf(ctx(), "created '%s'\n", path)
}

func sftpFileNotExistsMust(sftp *sftp.Client, path string) {
	_, err := sftp.Stat(path)
	u.PanicIf(err == nil, "file '%s' already exists on the server\n", path)
}

func sftpMkdirAllMust(sftp *sftp.Client, path string) {
	err := sftp.MkdirAll(path)
	panicIf(err != nil, "sftp.MkdirAll('%s') failed with '%s'", path, err)
	logf(ctx(), "created '%s' dir on the server\n", path)
}

func sshRunCommandMust(client *goph.Client, exe string, args ...string) {
	cmd, err := client.Command(exe, args...)
	panicIf(err != nil, "client.Command() failed with '%s'\n", err)
	logf(ctx(), "running '%s' on the server\n", cmd.String())
	out, err := cmd.CombinedOutput()
	logf(ctx(), "%s:\n%s\n", cmd.String(), string(out))
	panicIf(err != nil, "cmd.Output() failed with '%s'\n", err)
}

func copyToServerMaybeGzippedMust(client *goph.Client, sftp *sftp.Client, localPath, remotePath string, gzipped bool) {
	if gzipped {
		remotePath += ".gz"
		sftpFileNotExistsMust(sftp, remotePath)
		u.GzipFile(localPath+".gz", localPath)
		localPath += ".gz"
		defer os.Remove(localPath)
	}
	sizeStr := u.FormatSize(u.FileSize(localPath))
	logf(ctx(), "uploading '%s' (%s) to '%s'", localPath, sizeStr, remotePath)
	timeStart := time.Now()
	err := client.Upload(localPath, remotePath)
	panicIf(err != nil, "\nclient.Upload() failed with '%s'", err)
	logf(ctx(), " took %s\n", time.Since(timeStart))

	if gzipped {
		// ungzip on the server
		sshRunCommandMust(client, "gzip", "-d", remotePath)
	}
}

func createNewTmuxSession(name string) {
	cmd := exec.Command("tmux", "new-session", "-d", "-s", name)
	out, err := cmd.CombinedOutput()
	if err != nil {
		if strings.Contains(string(out), "duplicate session") {
			logf(ctx(), "tmux session '%s' already exists\n", name)
			return
		}
		panicIf(err != nil, "tmux new-session failed with '%s'\n", err)
		logf(ctx(), "%s:\n%s\n", cmd.String(), string(out))
	}
}

func tmuxSendKeys(sessionName string, text string) {
	cmd := exec.Command("tmux", "send-keys", "-t", sessionName, text, "Enter")
	out, err := cmd.CombinedOutput()
	logf(ctx(), "%s:\n%s\n", cmd.String(), string(out))
	panicIf(err != nil, "%s failed with %s\n", cmd.String(), err)
}

func deleteOldBuilds() {
	pattern := exeBaseName + "-*"
	files, err := filepath.Glob(pattern)
	must(err)
	for _, path := range files {
		err = os.Remove(path)
		must(err)
		logf(ctx(), "deleted %s\n", path)
	}
}

func validateSecrets(m map[string]string) {
	for _, k := range wantedSecrets {
		_, ok := m[k]
		panicIf(!ok, "didn't find secret '%s' in '%s'", k)
	}
}

func rebuildFrontend() {
	// assuming this is not deployment: re-build the frontend
	must(os.RemoveAll(frontEndBuildDir))
	logf(ctx(), "deleted frontend dist dir '%s'\n", frontEndBuildDir)
	if u.IsMac() {
		u.RunLoggedInDirMust("frontend", "bun", "install")
		u.RunLoggedInDirMust("frontend", "bun", "run", "build")
	} else if u.IsWindows() {
		u.RunLoggedInDirMust("frontend", "yarn")
		u.RunLoggedInDirMust("frontend", "yarn", "build")
	}
}

func buildForProd(forLinux bool) string {
	// re-build the frontend. remove build process artifacts
	// to keep things clean
	secretsPath := filepath.Join("server", "secrets.env")
	os.Remove(secretsPath)
	defer os.Remove(secretsPath)
	os.Remove(frontendZipName)
	defer os.Remove(frontendZipName)

	// copy secrets from ../secrets/${me}.env to server/secrets.env
	// so that it's included in the binary as secretsEnv
	{
		d, err := os.ReadFile(secretsSrcPath)
		must(err)
		m := u.ParseEnvMust(d)
		validateSecrets(m)
		err = os.WriteFile(secretsPath, d, 0644)
		must(err)
	}

	rebuildFrontend()
	defer os.RemoveAll(frontEndBuildDir)

	// get date and hash of current checkin
	var exeName string
	{
		// git log --pretty=format:"%h %ad %s" --date=short -1
		cmd := exec.Command("git", "log", "-1", `--pretty=format:%h %ad %s`, "--date=short")
		out, err := cmd.Output()
		panicIf(err != nil, "git log failed")
		s := strings.TrimSpace(string(out))
		//logf(ctx(), "exec out: '%s'\n", s)
		parts := strings.SplitN(s, " ", 3)
		panicIf(len(parts) != 3, "expected 3 parts in '%s'", s)
		date := parts[1]
		hashShort := parts[0]
		exeName = fmt.Sprintf("%s-%s-%s", exeBaseName, date, hashShort)
	}

	if u.IsWindows() {
		exeName += ".exe"
	}

	// package frontend code into  a zip file
	{
		err := u.CreateZipWithDirContent(frontendZipName, frontEndBuildDir)
		panicIf(err != nil, "u.CreateZipWithDirContent() failed with '%s'\n", err)
		size := u.FormatSize(u.FileSize(frontendZipName))
		logf(ctx(), "created %s of size %s\n", frontendZipName, size)
	}

	// build the binary, for linux if forLinux is true, otherwise for OS arh
	{
		// TODO: why needs ./server and not just "server"?
		// it works in arslexis-website
		cmd := exec.Command("go", "build", "-tags", "embed_frontend", "-o", exeName, "./server")
		if forLinux {
			cmd.Env = os.Environ()
			cmd.Env = append(cmd.Env, "GOOS=linux", "GOARCH=amd64")
		}
		out, err := cmd.CombinedOutput()
		logf(ctx(), "%s:\n%s\n", cmd.String(), out)
		panicIf(err != nil, "go build failed")

		sizeStr := u.FormatSize(u.FileSize(exeName))
		logf(ctx(), "created '%s' of size %s\n", exeName, sizeStr)
	}

	return exeName
}

func buildLocalProd() {
	deleteOldBuilds()
	exeName := buildForProd(false)
	exeSize := u.FormatSize(u.FileSize(exeName))
	logf(ctx(), "created:\n%s %s\n", exeName, exeSize)
}

/*
How deploying to hetzner works:
- compile linux binary with name ${app}-YYYY-MM-DD-${hashShort}
- copy binary to hetzner
- run on hetzner
*/
func deployToHetzner() {
	deleteOldBuilds()
	exeName := buildForProd(true)
	panicIf(!u.FileExists(exeName), "file '%s' doesn't exist", exeName)

	serverExePath := path.Join(deployServerDir, exeName)

	keyPath := u.ExpandTildeInPath(deployServerPrivateKeyPath)
	panicIf(!u.FileExists(keyPath), "key file '%s' doesn't exist", keyPath)
	auth, err := goph.Key(keyPath, "")
	panicIf(err != nil, "goph.Key() failed with '%s'", err)
	client, err := goph.New(deployServerUser, deployServerIP, auth)
	panicIf(err != nil, "goph.New() failed with '%s'", err)
	defer client.Close()

	// global sftp client for multiple operations
	sftp, err := client.NewSftp()
	panicIf(err != nil, "client.NewSftp() failed with '%s'", err)
	defer sftp.Close()

	// check:
	// - caddy is installed
	// - binary doesn't already exists
	{
		_, err = sftp.Stat(deployServerCaddyConfigPath)
		panicIf(err != nil, "sftp.Stat() for '%s' failed with '%s'\nInstall caddy on the server?\n", deployServerCaddyConfigPath, err)

		sftpFileNotExistsMust(sftp, serverExePath)
	}

	// create destination dir on the server
	sftpMkdirAllMust(sftp, deployServerDir)

	// copy binary to the server
	copyToServerMaybeGzippedMust(client, sftp, exeName, serverExePath, true)

	// make the file executable
	{
		err = sftp.Chmod(serverExePath, 0755)
		panicIf(err != nil, "sftp.Chmod() failed with '%s'", err)
		logf(ctx(), "created dir on the server '%s'\n", deployServerDir)
	}

	sshRunCommandMust(client, serverExePath, "-setup-and-run")
	logf(ctx(), "Running on http://%s:%d or https://%s\n", deployServerIP, httpPort, domain)
}

func setupAndRun() {
	logf(ctx(), "setupAndRun() for %s\n", exeBaseName)

	if len(frontendZipData) < 1024 {
		logf(ctx(), "frontendZipData is empty, must be embedded\n")
		os.Exit(1)
	}

	if !u.FileExists(deployServerCaddyConfigPath) {
		logf(ctx(), "%s doesn't exist.\nMust install caddy?\n", deployServerCaddyConfigPath)
		os.Exit(1)
	}

	// kill existing process
	// note: muse use "ps ax" (and not e.g. "pkill") because we don't want to kill ourselves
	{
		out := u.RunMust("ps", "ax")
		lines := strings.Split(out, "\n")
		pidsToKill := []string{}
		for _, l := range lines {
			if len(l) == 0 {
				continue
			}
			parts := strings.Fields(l)
			//parts := strings.SplitN(l, "\t", 5)
			if len(parts) < 5 {
				logf(ctx(), "unexpected line in ps ax: '%s', len(parts)=%d\n", l, len(parts))
				continue
			}
			pid := parts[0]
			name := parts[4]
			if !strings.Contains(name, exeBaseName) {
				//logf(ctx(), "skipping process '%s' pid: '%s'\n", name, pid)
				continue
			}
			logf(ctx(), "MAYBE KILLING process '%s' pid: '%s'\n", name, pid)
			myPid := fmt.Sprintf("%v", os.Getpid())
			if pid == myPid {
				logf(ctx(), "NOT KILLING because it's myself\n")
				// no suicide allowed
				continue
			}
			pidsToKill = append(pidsToKill, pid)
			logf(ctx(), "found process to kill: '%s' pid: '%s'\n", name, pid)
		}
		for _, pid := range pidsToKill {
			u.RunLoggedMust("kill", pid)
		}
		if len(pidsToKill) == 0 {
			logf(ctx(), "no %s* processes to kill\n", exeBaseName)
		}
	}

	ownExeName := filepath.Base(os.Args[0])
	if false {
		createNewTmuxSession(tmuxSessionName)
		// cd to deployServer
		tmuxSendKeys(tmuxSessionName, fmt.Sprintf("cd %s", deployServerDir))
		// run the server
		tmuxSendKeys(tmuxSessionName, fmt.Sprintf("./%s -run-prod", ownExeName))
	}

	// configure systemd to restart on reboot
	{
		// systemd-run.sh script that will be called by systemd on reboot
		runScript := strings.ReplaceAll(systemdRunScriptTmpl, "{exeName}", ownExeName)
		runScript = strings.ReplaceAll(runScript, "{sessionName}", exeBaseName)
		runScript = strings.ReplaceAll(runScript, "{workdDir}", deployServerDir)
		writeFileMust(systemdRunScriptPath, runScript, 0755)

		// systemd .service file linked from /etc/systemd/system/
		writeFileMust(systemdServicePath, systemdService, 0755)
		os.Remove(systemdServicePathLink)
		err := os.Symlink(systemdServicePath, systemdServicePathLink)
		panicIf(err != nil, "os.Symlink(%s, %s) failed with '%s'", systemdServicePath,
			systemdServicePathLink, err)
		logf(ctx(), "created symlink '%s' to '%s'\n", systemdServicePathLink, systemdServicePath)

		serviceName := exeBaseName + ".service"

		// daemon-reload needed if service file changed
		u.RunLoggedMust("systemctl", "daemon-reload")
		// runLoggedMust("systemctl", "start", serviceName)
		u.RunLoggedMust("systemctl", "enable", serviceName)

		u.RunLoggedMust(systemdRunScriptPath)
	}

	// update and reload caddy config
	didReplace := u.AppendOrReplaceInFileMust(deployServerCaddyConfigPath, caddyConfig, caddyConfigDelim)
	if didReplace {
		u.RunLoggedMust("systemctl", "reload", "caddy")
	}

	// archive previous deploys
	{
		pattern := filepath.Join(deployServerDir, exeBaseName+"-*")
		files, err := filepath.Glob(pattern)
		must(err)
		logf(ctx(), "archiving previous deploys, pattern: '%s', %d files\n", pattern, len(files))
		backupDir := filepath.Join(deployServerDir, "backup")
		for _, file := range files {
			name := filepath.Base(file)
			if name == ownExeName {
				logf(ctx(), "skipping archiving of '%s' (myself)\n", name)
				continue
			}
			backupPath := filepath.Join(backupDir, name)
			err = os.MkdirAll(backupDir, 0755)
			u.PanicIfErr(err, "os.MkdirAll('%s') failed with %s\n", backupDir, err)
			err = os.Rename(file, backupPath)
			u.PanicIfErr(err, "os.Rename('%s', '%s') failed with %s\n", file, backupPath, err)
			logf(ctx(), "moved '%s' to '%s'\n", file, backupPath)
		}
	}
}

// for debugging it might useful to take a look at frontend
// files, so allow extracting them to filesystem
func extractFrontend() {
	panicIf(len(frontendZipData) == 0, "frontendZipData is empty\n")
	ownPath := os.Args[0]
	outDir := ownPath + "-frontend"
	err := u.UnzipDataToDir(frontendZipData, outDir)
	must(err)
	logf(ctx(), "extracted frontend zip files to '%s'\n", outDir)
}
