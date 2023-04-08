package main

import (
	"context"
	"fmt"
)

func logf(ctx context.Context, s string, args ...interface{}) {
	if len(args) > 0 {
		s = fmt.Sprintf(s, args...)
	}
	fmt.Print(s)
}

func logErrorf(ctx context.Context, format string, args ...interface{}) {
	s := format
	if len(args) > 0 {
		s = fmt.Sprintf(format, args...)
	}
	cs := getCallstack(1)
	logf(ctx, "Error: %s\n%s\n", s, cs)
}

// return true if there was an error
func logIfErrf(ctx context.Context, err error, msgAndArgs ...interface{}) bool {
	if err == nil {
		return false
	}
	msg := ""
	if len(msgAndArgs) > 0 {
		// first arg should be a format string but we're playing it safe
		msg = fmt.Sprintf("%s", msgAndArgs)
		if len(msgAndArgs) > 1 {
			msg = fmt.Sprintf(msg, msgAndArgs[1:]...)
		}
	}

	cs := getCallstack(1)
	if msg != "" {
		logf(ctx, "Error: %s\n%s\n%s\n", err, msg, cs)

	} else {
		logf(ctx, "Error: %s\n%s\n", err, cs)
	}
	return true
}
