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

var (
	exeBaseName      = "onlinetool"
	domain           = "onlinetool.io"
	httpPort         = 9219
	wantedSecrets    = []string{"ONLINETOOL_AXIOM_TOKEN", "ONLINETOOL_PIRSCH_SECRET", "ONLINETOOL_GITHUB_SECRET_PROD", "ONLINETOOL_GITHUB_SECRET_LOCAL"}
	frontEndBuildDir = filepath.Join("frontend", "dist")
	frontendZipName  = filepath.Join("server", "frontend.zip")
	secretsPath      = filepath.Join("server", "secrets.env")
	secretsSrcPath   = filepath.Join("..", "secrets", "onlinetool.env")

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

func addNewline(s *string) string {
	if strings.HasSuffix(*s, "\n") {
		return *s
	}
	*s = *s + "\n"
	return *s
}

func collapseMultipleNewlines(s string) string {
	s = strings.ReplaceAll(s, "\r\n", "\n") // CRLF => CR
	prev := ""
	for prev != s {
		prev = s
		s = strings.ReplaceAll(s, "\n\n\n", "\n\n")
	}
	return s
}

func appendOrReplaceInText(orig string, toAppend string, delim string) string {
	addNewline(&toAppend)
	addNewline(&delim)
	content := "\n\n" + delim + toAppend + delim
	start := strings.Index(orig, delim)
	if strings.Contains(orig, content) {
		return collapseMultipleNewlines(orig)
	}
	if start >= 0 {
		end := strings.Index(orig[start+1:], delim)
		panicIf(end == -1, "didn't find end delim")
		end += start + 1
		orig = orig[:start] + "\n\n" + orig[end+len(delim):]
	}
	res := addNewline(&orig) + delim + toAppend + delim
	return collapseMultipleNewlines(res)
}

func appendOrReplaceInFile(path string, toAppend string, delim string) {
	st, err := os.Lstat(path)
	must(err)
	perm := st.Mode().Perm()
	orig, err := os.ReadFile(path)
	must(err)
	newContent := appendOrReplaceInText(string(orig), toAppend, delim)
	if newContent == string(orig) {
		return
	}
	os.WriteFile(path, []byte(newContent), perm)
}

func writeFileMust(path string, s string, perm fs.FileMode) {
	err := os.WriteFile(path, []byte(s), perm)
	panicIf(err != nil, "os.WriteFile(%s) failed with '%s'", path, err)
	logf(ctx(), "created '%s'\n", path)
}

func cmdRunMust(exe string, args ...string) string {
	cmd := exec.Command(exe, args...)
	d, err := cmd.CombinedOutput()
	out := string(d)
	panicIf(err != nil, "'%s' failed with '%s', out:\n'%s'\n", cmd.String(), err, out)
	return out
}

func cmdRunLoggedMust(exe string, args ...string) string {
	cmd := exec.Command(exe, args...)
	d, err := cmd.CombinedOutput()
	out := string(d)
	panicIf(err != nil, "'%s' failed with '%s', out:\n'%s'\n", cmd.String(), err, out)
	logf(ctx(), "%s:\n%s\n", cmd.String(), out)
	return out
}

func sftpFileNotExistsMust(sftp *sftp.Client, path string) {
	_, err := sftp.Stat(path)
	if err == nil {
		logf(ctx(), "file '%s' already exists on the server\n", path)
	}
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

func ExpandTildeInPath(s string) string {
	if strings.HasPrefix(s, "~") {
		dir, err := os.UserHomeDir()
		must(err)
		return dir + s[1:]
	}
	return s
}

func deleteOldBuilds() {
	pattern := exeBaseName + "-*"
	files, err := filepath.Glob(pattern)
	must(err)
	for _, path := range files {
		isDir, err := u.PathIsDir(path)
		must(err)
		if isDir {
			if strings.HasSuffix(path, "-frontend") {
				err = os.RemoveAll(path)
				must(err)
				logf(ctx(), "removed directory %s\n", path)
			} else {
				logf(ctx(), "skipping removal of directory %s\n", path)
			}
			continue
		}
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

func buildForProd(forLinux bool) string {
	// re-build the frontend. remove build process artifacts
	// to keep things clean
	os.Remove(secretsPath)
	defer os.Remove(secretsPath)
	os.Remove(frontendZipName)
	defer os.Remove(frontendZipName)
	os.RemoveAll(frontEndBuildDir)

	// copy secrets from ../secrets/onlinetools.env to server/secrets.env
	// so that it's included in the binary as secretsEnv
	{
		d, err := os.ReadFile(secretsSrcPath)
		must(err)
		m := parseEnv(d)
		validateSecrets(m)
		err = os.WriteFile(secretsPath, d, 0644)
		must(err)
	}

	if u.IsMac() {
		runCmdLoggedInDir(".", "bun", "install")
		runCmdLoggedInDir(".", "bun", "run", "build")
	} else {
		runCmdLoggedInDir(".", "yarn")
		runCmdLoggedInDir(".", "yarn", "build")
	}

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
		path := filepath.Join("frontend", "dist")
		err := u.CreateZipWithDirContent(frontendZipName, path)
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

	keyPath := ExpandTildeInPath(deployServerPrivateKeyPath)
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
		out := cmdRunMust("ps", "ax")
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
			cmdRunLoggedMust("kill", pid)
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
		cmdRunLoggedMust("systemctl", "daemon-reload")
		// cmdRunLoggedMust("systemctl", "start", serviceName)
		cmdRunLoggedMust("systemctl", "enable", serviceName)

		cmdRunLoggedMust(systemdRunScriptPath)
	}

	// update and reload caddy config
	appendOrReplaceInFile(deployServerCaddyConfigPath, caddyConfig, caddyConfigDelim)
	cmdRunLoggedMust("systemctl", "reload", "caddy")

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

	m, err := u.ReadZipData(frontendZipData)
	u.PanicIfErr(err, "u.ReadZipData() failed with %s\n", err)
	ownPath := os.Args[0]
	outDir := ownPath + "-frontend"
	for name, d := range m {
		// names in zip are unix-style, convert to windows-style
		name = filepath.FromSlash(name)
		path := filepath.Join(outDir, name)
		dir := filepath.Dir(path)
		err = os.MkdirAll(dir, 0755)
		u.PanicIfErr(err, "os.MkdirAll('%s') failed with %s\n", dir, err)
		err = os.WriteFile(path, d, 0644)
		u.PanicIfErr(err, "os.WriteFile('%s') failed with %s\n", path, err)
		logf(ctx(), "extracted '%s'\n", path)
	}
	logf(ctx(), "extracted %d files to '%s'\n", len(m), outDir)
}
