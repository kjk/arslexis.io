package main

import (
	"arslexis/server"
	"embed"
)

var (
	//go:embed dist/*
	distFS embed.FS
)

func main() {
	server.DistFS = distFS
	server.Main()
}
