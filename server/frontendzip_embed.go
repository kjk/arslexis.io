//go:build embed_frontend

package main

import (
	_ "embed"
)

//go:embed frontend.zip
var frontendZipData []byte
