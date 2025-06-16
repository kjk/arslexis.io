package main

import (
	"arslexis/server"
	"embed"
)

var (
	//go:embed dist/*
	wwwFS embed.FS
)

func main() {
	server.WwwFS = wwwFS
	server.Main()
}
