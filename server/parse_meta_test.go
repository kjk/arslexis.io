package server

import (
	"testing"

	"github.com/kjk/common/assert"
)

var (
	s = `// :run go run main.go -echo echo-arg additional arg
// :collection Essential Go
package server

import (
	"flag"
	"fmt"
	"os"
)
`
)

func TestParseMetaFromText(t *testing.T) {
	m := parseMetaFromText(s)
	assert.True(t, m.DidParse)
	assert.Equal(t, m.RunCmd, "go run main.go -echo echo-arg additional arg")
	assert.Equal(t, m.Collection, "Essential Go")
}
