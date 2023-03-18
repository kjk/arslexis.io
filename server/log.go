package main

import (
	"context"
	"fmt"
)

var (
	verbose bool
)

func logf(ctx context.Context, s string, args ...interface{}) {
	if len(args) > 0 {
		s = fmt.Sprintf(s, args...)
	}
	fmt.Print(s)
}

func verbosef(ctx context.Context, format string, args ...interface{}) {
	if !verbose {
		return
	}
	logf(ctx, format, args...)
}

func logerrf(ctx context.Context, format string, args ...interface{}) {
	s := format
	if len(args) > 0 {
		s = fmt.Sprintf(format, args...)
	}
	fmt.Printf("Error: %s", s)
}

func logErrorf(ctx context.Context, s string, args ...interface{}) {
	if len(args) > 0 {
		s = fmt.Sprintf(s, args...)
	}
	cs := getCallstack(1)
	fmt.Printf("%s\n%s\n", s, cs)
}

// return true if there was an error
func logIfError(ctx context.Context, err error) bool {
	if err == nil {
		return false
	}
	logErrorf(ctx, "err.Error(): %s", err.Error())
	return true
}
