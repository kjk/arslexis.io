package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/kjk/common/u"
)

var (
	f          = fmt.Sprintf
	e          = fmt.Errorf
	must       = u.Must
	panicIf    = u.PanicIf
	panicIfErr = u.PanicIfErr
	isWinOrMac = u.IsWinOrMac
	isLinux    = u.IsLinux
	formatSize = u.FormatSize
)

func ctx() context.Context {
	return context.Background()
}

func runLoggedInDirMust(dir string, exe string, args ...string) {
	cmd := exec.Command(exe, args...)
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	must(err)
}

func getCallstackFrames(skip int) []string {
	var callers [32]uintptr
	n := runtime.Callers(skip+1, callers[:])
	frames := runtime.CallersFrames(callers[:n])
	var cs []string
	for {
		frame, more := frames.Next()
		if !more {
			break
		}
		s := frame.File + ":" + strconv.Itoa(frame.Line)
		cs = append(cs, s)
	}
	return cs
}

func getCallstack(skip int) string {
	frames := getCallstackFrames(skip + 1)
	return strings.Join(frames, "\n")
}

const (
	htmlMimeType     = "text/html; charset=utf-8"
	jsMimeType       = "text/javascript; charset=utf-8"
	markdownMimeType = "text/markdown; charset=UTF-8"
)

func jsonUnmarshalReader(r io.Reader, v interface{}) error {
	d, err := io.ReadAll(r)
	if err != nil {
		return err
	}
	return json.Unmarshal(d, v)
}

func fmtSmart(format string, args ...interface{}) string {
	if len(args) == 0 {
		return format
	}
	return fmt.Sprintf(format, args...)
}

func startLoggedInDir(dir string, exe string, args ...string) (func(), error) {
	cmd := exec.Command(exe, args...)
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Start()
	if err != nil {
		return nil, err
	}
	return func() {
		cmd.Process.Kill()
	}, nil
}

func push[S ~[]E, E any](s *S, els ...E) {
	*s = append(*s, els...)
}

func sliceLimit[S ~[]E, E any](s S, max int) S {
	if len(s) > max {
		return s[:max]
	}
	return s
}

func waitForSigIntOrKill() {
	// Ctrl-C sends SIGINT
	sctx, stop := signal.NotifyContext(ctx(), os.Interrupt /*SIGINT*/, os.Kill /* SIGKILL */, syscall.SIGTERM)
	defer stop()
	<-sctx.Done()
}

func printFS(fsys fs.FS, startDir string) {
	logf("printFS('%s')\n", startDir)
	dfs := fsys.(fs.ReadDirFS)
	nFiles := 0
	u.IterReadDirFS(dfs, startDir, func(filePath string, d fs.DirEntry) error {
		logf("%s\n", filePath)
		nFiles++
		return nil
	})
	logf("%d files\n", nFiles)
}

func updateGoDeps(noProxy bool) {
	{
		cmd := exec.Command("go", "get", "-u", ".")
		cmd.Dir = "server"
		if noProxy {
			cmd.Env = append(os.Environ(), "GOPROXY=direct")
		}
		logf("running: %s in dir '%s'\n", cmd.String(), cmd.Dir)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		err := cmd.Run()
		panicIf(err != nil, "go get failed with '%s'", err)
	}
	{
		cmd := exec.Command("go", "mod", "tidy")
		cmd.Dir = "server"
		logf("running: %s in dir '%s'\n", cmd.String(), cmd.Dir)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		err := cmd.Run()
		panicIf(err != nil, "go get failed with '%s'", err)
	}
}

func measureDuration() func() {
	timeStart := time.Now()
	return func() {
		logf("took %s\n", time.Since(timeStart))
	}
}
