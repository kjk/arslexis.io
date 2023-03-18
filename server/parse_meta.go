package main

import (
	"strings"
)

type EvalMeta struct {
	RunCmd     string
	Collection string

	DidParse bool
}

// returns a string and rest
func getNextLine(s string) (string, string) {
	idx := strings.Index(s, "\n")
	if idx == -1 {
		return s, ""
	}
	res := s[:idx]
	rest := s[idx+1:]
	return res, rest
}

func trimPrefix(s, prefix string) (string, bool) {
	rest := strings.TrimPrefix(s, prefix)
	if rest == s {
		return s, false
	}
	return rest, true
}

func stripComment(s string) string {
	s = strings.TrimSpace(s)
	var ok bool
	s, ok = trimPrefix(s, "//")
	if !ok {
		s, ok = trimPrefix(s, "#")
	}
	if !ok {
		s, ok = trimPrefix(s, "/*")
	}
	if !ok {
		s, ok = trimPrefix(s, "--") // lua
	}
	if !ok {
		return ""
	}
	return strings.TrimSpace(s)
}

// return false if should stop parsing
func parseMetaValueFromLine(s string, m *EvalMeta) {
	s, ok := trimPrefix(s, ":")
	if !ok {
		return
	}
	s, ok = trimPrefix(s, "run")
	if ok {
		m.RunCmd = strings.TrimSpace(s)
		m.DidParse = true
		return
	}
	s, ok = trimPrefix(s, "collection")
	if ok {
		m.Collection = strings.TrimSpace(s)
		m.DidParse = true
		return
	}
}

// scan comment lines at the beginning of text
// and parse meta values
// returns nil if didn't parse anything
func parseMetaFromText(s string) *EvalMeta {
	var m EvalMeta
	for len(s) > 0 {
		line, rest := getNextLine(s)
		line = stripComment(line)
		if line == "" {
			// stop at first non-comment line
			break
		}
		parseMetaValueFromLine(line, &m)
		s = rest
	}
	if m.DidParse {
		return &m
	}
	return nil
}
