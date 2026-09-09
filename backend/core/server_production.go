//go:build production

package core

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed ui/dist/*
var frontendFiles embed.FS

func FrontendHandler(mux *http.ServeMux) error {
	// get folder that contains static files
	distFS, err := fs.Sub(frontendFiles, "ui/dist")
	if err != nil {
		return fmt.Errorf("[FrontendHandler] failed to initialize static files: %s", err)
	}

	// create Go file server and wrap it around SPA logic
	fileServer :=  http.FileServer(http.FS(distFS))
	mux.Handle("/", SPAHandler(distFS, fileServer))
	return nil
}

// implements the "fallback to index.html" rule so frontend can load successfully
func SPAHandler(staticFS fs.FS, fileServer http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		// try to find the file browser asked for
		_, err := staticFS.Open(path)
		if err != nil {
			r.URL.Path = "/"
		}
		
		// serve the file
		fileServer.ServeHTTP(w, r)
	}
}