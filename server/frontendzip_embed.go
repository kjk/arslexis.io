//go:build embed_frontend

package main

import (
	_ "embed"
)

//go:embed frontend.zip
var frontendZipData []byte

//go:embed secrets.env
var secretsEnv []byte
