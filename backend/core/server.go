package core

import (
	"encoding/json"
	"io/fs"
	"log"
	"log/slog"
	"net/http"
	"strings"
)

// Health status endpoint
func HealthHandler(logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		logger.Debug("application status", "healthy", true)
		EncodeJSON(w, map[string]string{"status": "ok"}, "")
	}
}

func FrontendHandler(mux *http.ServeMux, distFS fs.FS) error {
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
		if _, err := staticFS.Open(path); err != nil {
			r.URL.Path = "/"
		}

		// serve the file
		fileServer.ServeHTTP(w, r)
	}
}

// Used to structure JSON encoded responses.
func EncodeJSON(w http.ResponseWriter, content any, errMessage string) {
	if errMessage == "" {
		// If custom error message variable is empty, use default
		errMessage = "error encoding response"
	}

	err := json.NewEncoder(w).Encode(content)
	if err != nil {
		// Todo: switch to slog
		log.Printf("%s: %s", errMessage, err)
	}
}