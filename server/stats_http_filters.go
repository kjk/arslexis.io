package main

// those are different for each server

var (
	filter200Prefixes = []string{}
	filter200Suffixes = []string{".css", ".js", ".jpg", ".png", ".jpeg", ".webp", ".ico", ".gif", ".xml", "/robots.txt", "/ping", "/ping.txt"}
	filter404Suffixes = []string{
		"/apple-touch-icon.png", // TODO: maybe return the .ico as .png
		"/apple-touch-icon-120x120.png",
		"/apple-touch-icon-precomposed.png",
		"/apple-touch-icon-120x120-precomposed.png",
	}
	filter404Prefixes = []string{"/admin/"}
)
