//go:build !production

package main

import "net/http"

func registerFrontend(mux *http.ServeMux) error {
	// nothing
	return nil
}