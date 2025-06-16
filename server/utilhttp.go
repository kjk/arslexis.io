package server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"reflect"
	"strconv"
	"strings"
)

func serveInternalError(w http.ResponseWriter, err error) {
	w.WriteHeader(http.StatusInternalServerError)
	io.WriteString(w, err.Error())
}

func writeHeader(w http.ResponseWriter, code int, contentType string) {
	w.Header().Set("Content-Type", contentType+"; charset=utf-8")
	w.WriteHeader(code)
}

func serveJSONWithCode(w http.ResponseWriter, r *http.Request, code int, v interface{}) {
	d, err := json.Marshal(v)
	if err != nil {
		serveInternalError(w, e("json.Marshal() failed with '%s'", err))
		return
	}
	writeHeader(w, code, jsMimeType)
	_, err = w.Write(d)
	logIfErrf(err)
}

func serveJSONOK(w http.ResponseWriter, r *http.Request, v interface{}) {
	serveJSONWithCode(w, r, http.StatusOK, v)
}

func serveJSONData(w http.ResponseWriter, d []byte, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(d)
}

func serveJSON(w http.ResponseWriter, v interface{}, code int) {
	d, err := json.Marshal(v)
	if err != nil {
		serveInternalError(w, err)
		return
	}
	serveJSONData(w, d, code)
}

func serveJSONOk(w http.ResponseWriter, v interface{}) {
	serveJSON(w, v, http.StatusOK)
}

func serveJSONOkMsg(w http.ResponseWriter, format string, args ...interface{}) {
	s := fmtSmart2(format, args...)
	v := map[string]interface{}{
		"Message": s,
	}
	serveJSON(w, v, http.StatusOK)
}

func fmtSmart2(format string, args ...interface{}) string {
	if len(args) == 0 {
		return format
	}
	return fmt.Sprintf(format, args...)
}

// https://gist.github.com/dipeshdulal/40aed9c9a55ac356bf45b2eafb08424a#file-fullmapping-go
func getURLParams(urlVals url.Values, args ...any) error {
	if len(args) == 0 || len(args)%2 == 1 {
		return fmt.Errorf("must have even number of args")
	}
	for i := 0; i < len(args); i += 2 {
		name := args[i].(string)
		if !urlVals.Has(name) {
			return fmt.Errorf("missing '%s' url arg", name)
		}
		val := strings.TrimSpace(urlVals.Get(name))
		if val == "" {
			return fmt.Errorf("url arg '%s' is empty", name)
		}
		valParsedOut := args[i+1]
		typ := reflect.TypeOf(valParsedOut)
		td := typ.Elem()
		outElem := reflect.ValueOf(valParsedOut).Elem()
		switch td.Kind() {

		case reflect.String:
			outElem.SetString(val)

		case reflect.Int, reflect.Int16, reflect.Int32, reflect.Int64:
			n, err := strconv.ParseInt(val, 10, 64)
			if err != nil {
				return fmt.Errorf("url arg '%s' is not an int", name)
			}
			outElem.SetInt(int64(n))

		default:
			return fmt.Errorf("unsupported type '%s'", td.Kind())
		}
	}
	return nil
}

func tempRedirect(w http.ResponseWriter, r *http.Request, newURL string) {
	http.Redirect(w, r, newURL, http.StatusTemporaryRedirect)
}
