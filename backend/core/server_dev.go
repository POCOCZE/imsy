//go:build !production

package core

import "net/http"

func FrontendHandler(mux *http.ServeMux) error {
	// nothing
	return nil
}