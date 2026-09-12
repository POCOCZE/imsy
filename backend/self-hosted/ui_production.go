//go:build production

package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"

	"github.com/pococze/imsy/backend/core"
)

//go:embed ui/dist/*
var frontendFiles embed.FS

func registerFrontend(mux *http.ServeMux) error {
	// get folder that contains static files
	distFS, err := fs.Sub(frontendFiles, "ui/dist")
	if err != nil {
		return fmt.Errorf("[registerFrontend] failed to initialize static files: %s", err)
	}

	if err := core.FrontendHandler(mux, distFS); err != nil {
		return fmt.Errorf("[registerFrontend] failed to register frontend handler: %s", err)
	}
	return nil
}