package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/pirsch-analytics/pirsch-go-sdk"
)

var (
	pirschClientID     = "Gn7ZTbUOZPwKyr0whOgLFHnoodGvZdkv"
	pirschClientSecret = ""
	pirschHost         = "onlinetool.io"
	pirschClient       *pirsch.Client
	pirschExtsNoLog    = []string{".js", ".css", ".ico", ".png", ".jpeg", ".jpg", ".webp", ".svg", ".txt", ".xml", ".js.map"}
)

func removeDntHeader(r *http.Request) {
	// must delete Do Not Track header because it seems to be set by default
	// on Chrome and Hit() will not send info if is set, which defeats the purpose
	r.Header.Del("DNT")
}

func pirschSendHit(r *http.Request) {
	if pirschClientSecret == "" || r == nil || r.URL == nil {
		return
	}
	if !strings.Contains(r.Host, pirschHost) {
		// don't log dev traffic (localhost etc.)
		return
	}
	if pirschClient == nil {
		pirschClient = pirsch.NewClient(pirschClientID, pirschClientSecret, nil)
	}
	uri := r.URL.Path
	for _, ext := range pirschExtsNoLog {
		if strings.HasSuffix(uri, ext) {
			return
		}
	}
	removeDntHeader(r)
	// TODO: use HitWithOptions and set better RemoteIP
	err := pirschClient.Hit(r)
	if err != nil {
		logErrorf(ctx(), "pirschClient.Hit() failed with '%s'\n", err)
	}
}

func pirschSendEvent(r *http.Request, name string, durMs int, meta map[string]string) {
	if pirschClientSecret == "" || r == nil || r.URL == nil {
		return
	}
	if !strings.Contains(r.Host, pirschHost) {
		// don't log dev traffic (localhost etc.)
		return
	}
	removeDntHeader(r)
	// note: pirsch says dur is in seconds but it doesn't make sense and it's just a
	// number so I'm sending it as milliseconds
	err := pirschClient.Event(name, durMs, meta, r)
	if err != nil {
		logErrorf(ctx(), "pirschClient.Event() failed with '%s'\n", err)
		return
	}
	s := "event: " + name
	for k, v := range meta {
		s = fmt.Sprintf("%s %s=%s", s, k, v)
	}
	logf(ctx(), "%s\n", s)
}

// log event to pirsch analytics
// /event/${name}
// body is JSON with metadata for POST / PUT or ?foo=bar keys
// if duration is included, it's dur field in metadata
func handleEvent(w http.ResponseWriter, r *http.Request) {
	uri := r.URL.Path
	name := strings.TrimPrefix(uri, "/event/")
	if name == "" {
		logErrorf(ctx(), "/event/ has no name\n")
		http.NotFound(w, r)
		return
	}

	durMs := 0
	meta := map[string]string{}
	logKV := func(k, v string) {
		if k == "dur" {
			durMs, _ = strconv.Atoi(v)
			return
		}
		if v != "" {
			meta[k] = v
		}
	}

	if r.Method == http.MethodPost || r.Method == http.MethodPut {
		var m map[string]interface{}
		dec := json.NewDecoder(r.Body)
		err := dec.Decode(&meta)
		if err != nil {
			// ignore but log
			logErrorf(ctx(), "dec.Decode() failed with '%s'\n", err)
		}
		for k, v := range m {
			vs := fmt.Sprintf("%s", v)
			logKV(k, vs)
		}
	}
	vals := r.Form
	for k := range vals {
		v := vals.Get(k)
		logKV(k, v)
	}
	pirschSendEvent(r, name, durMs, meta)
	axiomSendEvent(r, name, durMs, meta)

	content := bytes.NewReader([]byte("ok"))
	http.ServeContent(w, r, "foo.txt", time.Time{}, content)
}
