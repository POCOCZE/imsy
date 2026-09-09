package core

import (
	"encoding/json"
	"log"
	"log/slog"
	"net/http"
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

// Set handlers, middlewares and start the HTTP server on particular port.
func StartServer(port string, store IncidentStorage, logger *slog.Logger) {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/healthz", HealthHandler(logger))
	mux.HandleFunc("GET /api/report", GetReportHandler(store, logger))
	mux.HandleFunc("GET /api/incidents", GetAllHandler(store))
	mux.HandleFunc("POST /api/incidents", AddListHandler(store, logger))
	mux.HandleFunc("POST /api/incident", AddHandler(store, logger))
	mux.HandleFunc("PATCH /api/incident/{id}", EditHandler(store, logger))
	mux.HandleFunc("GET /api/incident/{id}", GetByIDHandler(store, logger))
	mux.HandleFunc("DELETE /api/incident/{id}", DeleteByIDHandler(store, logger))

	// !This removes all incidents forever! For testing.
	mux.HandleFunc("DELETE /api/delete-all-incidents-forever", DeleteAllHandler(store, logger))

	// empty function during development. During compilation the parameter -production is used to 
	if err := FrontendHandler(mux); err != nil {
		log.Fatalf("[StartServer] failed to serve frontend: %s", err)
	}

	// handler := CorsMiddleware(mux)
	logger.Info("server listening", "port", port)
	err := http.ListenAndServe(":"+port, mux)
	if err != nil {
		log.Fatalf("error starting HTTP server: %s", err)
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