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

func isLinux() bool {
	return !u.IsWinOrMac()
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
