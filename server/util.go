package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	"github.com/kjk/common/u"
)

var (
	must       = u.Must
	panicIf    = u.PanicIf
	isWinOrMac = u.IsWinOrMac
	formatSize = u.FormatSize
)

func ctx() context.Context {
	return context.Background()
}

func cmdLog(cmd *exec.Cmd) {
	cmd.Stdout = os.Stdout
	cmd.Stdin = os.Stdin
	cmd.Stderr = os.Stderr
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

func addNl(s string) string {
	n := len(s)
	if n == 0 {
		return s
	}
	if s[n-1] == '\n' {
		return s
	}
	return s + "\n"
}

const (
	htmlMimeType     = "text/html; charset=utf-8"
	jsMimeType       = "text/javascript; charset=utf-8"
	markdownMimeType = "text/markdown; charset=UTF-8"
)

func jsonUnmarshalReader(r io.Reader, v interface{}) error {
	d, err := ioutil.ReadAll(r)
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

func serveInternalError(w http.ResponseWriter, r *http.Request, format string, args ...interface{}) {
	logErrorf(r.Context(), addNl(format), args...)
	errMsg := fmtSmart(format, args...)
	v := map[string]interface{}{
		"URL":      r.URL.String(),
		"ErrorMsg": errMsg,
	}
	serveJSONWithCode(w, r, http.StatusInternalServerError, v)
}

func writeHeader(w http.ResponseWriter, code int, contentType string) {
	w.Header().Set("Content-Type", contentType+"; charset=utf-8")
	w.WriteHeader(code)
}

func serveJSONWithCode(w http.ResponseWriter, r *http.Request, code int, v interface{}) {
	d, err := json.Marshal(v)
	if err != nil {
		serveInternalError(w, r, "json.Marshal() failed with '%s'", err)
		return
	}
	writeHeader(w, code, jsMimeType)
	_, err = w.Write(d)
	logIfErrf(r.Context(), err)
}

func serveJSONOK(w http.ResponseWriter, r *http.Request, v interface{}) {
	serveJSONWithCode(w, r, http.StatusOK, v)
}

func serveJSON(w http.ResponseWriter, r *http.Request, code int, v interface{}) {
	ctx := r.Context()
	d, err := json.Marshal(v)
	if err != nil {
		logf(ctx, "json.Marshal() failed with '%s'", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "json.Marshal() failed with '%s'", err)
		return
	}

	w.Header().Set("content-type", "text/json")
	w.WriteHeader(code)
	_, _ = w.Write(d)
}

func printDir(dir string) {
	ctx := context.Background()
	fn := func(path string, info os.FileInfo, err error) error {
		if info == nil {
			logf(ctx, "%s\n", path)
			return nil
		}
		logf(ctx, "%s: %d\n", path, info.Size())
		return nil
	}
	filepath.Walk(dir, fn)
}

func readFileMust(path string) []byte {
	d, err := os.ReadFile(path)
	must(err)
	return d
}

func runCmdLoggedMust(cmd *exec.Cmd) string {
	cmd.Stdout = os.Stdout
	cmd.Stdin = os.Stdin
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err == nil {
		return ""
	}
	logf(ctx(), "cmd '%s' failed with '%s'\n", cmd, err)
	must(err)
	return ""
}
