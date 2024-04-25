package main

import (
	"fmt"
	"net/http"
	"strings"

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
		logErrorf("pirschClient.Hit() failed with '%s'\n", err)
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
		logErrorf("pirschClient.Event() failed with '%s'\n", err)
		return
	}
	s := "event: " + name
	for k, v := range meta {
		s = fmt.Sprintf("%s %s=%s", s, k, v)
	}
	logf("%s\n", s)
}
