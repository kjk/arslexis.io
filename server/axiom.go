package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

/*
curl -X 'POST' 'https://api.axiom.co/v1/datasets/onlinetool.io/ingest' \
  -H 'Authorization: Bearer $API_TOKEN' \
  -H 'Content-Type: application/x-ndjson' \
  -d '{ "path": "/download", "method": "GET", "duration_ms": 231, "res_size_bytes": 3012 }'
*/

var (
	axiomApiToken = ""
	axiomEndpoint = "https://api.axiom.co/v1/datasets/onlinetool.io/ingest"
)

// TODO: ip
func axiomLogHTTPReq(ctx context.Context, r *http.Request, status int, size int, dur time.Duration) {
	if axiomApiToken == "" || !strings.Contains(r.Host, pirschHost) {
		// don't log dev traffic (localhost etc.)
		return
	}

	durMs := int(dur / time.Millisecond)
	uri := r.URL.Path
	d := map[string]interface{}{
		"type":   "httplog",
		"status": status,
		"method": r.Method,
		"dur_ms": durMs,
		"size":   size,
		"uri":    uri,
	}
	addHdr := func(hdrName, logName string) {
		s := r.Header.Get(hdrName)
		if s != "" {
			d[logName] = s
		}
	}
	addHdr("content-type", "content_type")
	addHdr("user-agent", "user_agent")
	addHdr("referer", "referer")

	axiomSendJSON(d)
}

func axiomSendJSONData(body []byte) {
	br := bytes.NewReader(body)
	req, err := http.NewRequestWithContext(ctx(), http.MethodPost, axiomEndpoint, br)
	must(err)
	req.Header.Add("Authorization", "Bearer "+axiomApiToken)
	req.Header.Add("Content-Type", "application/x-ndjson")
	_, err = http.DefaultClient.Do(req)
	if err != nil {
		// not: not using log in case it also sends to axiom
		fmt.Printf("axiomLogHTTPReq: http.DefaultClient.Do() failed with '%s'\n", err)
	}
}

func axiomSendJSON(d map[string]interface{}) {
	body, err := json.Marshal(d)
	must(err)
	axiomSendJSONData(body)
}

func axiomSendJSON2(d map[string]string) {
	body, err := json.Marshal(d)
	must(err)
	axiomSendJSONData(body)
}

func axiomSendEvent(r *http.Request, name string, durMs int, meta map[string]string) {
	if axiomApiToken == "" || r == nil || r.URL == nil {
		return
	}
	if !strings.Contains(r.Host, pirschHost) {
		// don't log dev traffic (localhost etc.)
		return
	}
	meta["type"] = "event"
	meta["event"] = "name"
	if durMs > 0 {
		meta["dur_ms"] = strconv.Itoa(durMs)
	}
	axiomSendJSON2(meta)
}
