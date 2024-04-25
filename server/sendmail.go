package main

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/kjk/common/u"
	"github.com/mailgun/mailgun-go/v4"
)

// https://github.com/mailgun/mailgun-go
var (
	mailgunDomain = ""
	mailgunAPIKey = ""
)

const (
	emailSender = "onlinetool@arslexis.io"
)

func notifyMeViaEmail(subject, body, userEmail string) {
	mg := mailgun.NewMailgun(mailgunDomain, mailgunAPIKey)
	// add unique prefix to make it easy to create a filter for those messages in gmail
	if isDev() {
		subject = "(dev) notif: " + subject
	} else {
		subject = "notif: " + subject
	}
	if userEmail != "" {
		subject += " (" + userEmail + ")"
	}
	recipient := "kkowalczyk@gmail.com"
	message := mg.NewMessage(emailSender, subject, body, recipient)
	ctx, cancel := context.WithTimeout(ctx(), time.Second*10)
	defer cancel()
	_, _, err := mg.Send(ctx, message)
	if err != nil {
		logf("notifyMeViaEmail: msg.Send() failed with %s\n", err)
		return
	}
	logf("notifyMeViaEmail: sent email, subject '%s'\n", subject)
}

func sendCrashEmail(errStr string, r *http.Request) {
	// for now e-mail myself about panics in prod
	cs := u.GetCallstack(3)
	uri := ""
	if r != nil {
		uri = r.RequestURI
	}
	body := fmt.Sprintf("we crashed!\nurl: %s\ncallstack:\n%s\n%s\n", uri, cs, errStr)
	notifyMeViaEmail("panic", body, "")
}

type Throttler struct {
	mu              sync.Mutex
	lastTime        time.Time
	nSinceLastReset int
	nPerPeriod      int
	interval        time.Duration
}

// don't send more than 6 email per hour
var emailThrottler = Throttler{
	nPerPeriod: 6,
	interval:   time.Hour,
}

func shouldThrottle(t *Throttler) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	now := time.Now()
	if now.Sub(t.lastTime) < t.interval {
		t.nSinceLastReset++
		return t.nSinceLastReset > t.nPerPeriod
	}
	t.lastTime = now
	t.nSinceLastReset = 0
	return false
}

func sendErrorEmailThrottled(body string) {
	if shouldThrottle(&emailThrottler) {
		return
	}
	notifyMeViaEmail("error", body, "")
}

func sendDailyURLHitsEmail(path string) {
	subject := "url hits and events"
	body := parseSLogStats(path, 100, 5)
	notifyMeViaEmail(subject, body, "")
}

func sendDailyEmails() {
	logf("sendDailyEmails: starting\n")
}
