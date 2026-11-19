package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/pococze/imsy/backend/core"
)

// Set handlers, middlewares and start the HTTP server on particular port.
func StartServer(port string, store core.IncidentStorage, logger *slog.Logger) {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/healthz", core.HealthHandler(logger))
	mux.HandleFunc("GET /api/report", core.GetReportHandler(store, logger))
	mux.HandleFunc("GET /api/incidents", core.GetAllHandler(store, logger))
	mux.HandleFunc("POST /api/incidents", core.AddListHandler(store, logger))
	mux.HandleFunc("POST /api/incident", core.AddHandler(store, logger))
	mux.HandleFunc("PATCH /api/incident/{id}", core.EditHandler(store, logger))
	mux.HandleFunc("GET /api/incident/{id}", core.GetByIDHandler(store, logger))
	mux.HandleFunc("DELETE /api/incident/{id}", core.DeleteByIDHandler(store, logger))

	// !This removes all incidents forever! For testing.
	mux.HandleFunc("DELETE /api/delete-all-incidents-forever", core.DeleteAllHandler(store, logger))

	// empty function during development. During compilation the parameter -production is used to 
	if err := registerFrontend(mux); err != nil {
		logger.Error(fmt.Sprintf("failed to serve frontend: %s", err))
		os.Exit(1)
	}

	// handler := CorsMiddleware(mux)
	logger.Info("server listening", "port", port)
	err := http.ListenAndServe(":"+port, mux)
	if err != nil {
		logger.Error(fmt.Sprintf("failed to start HTTP server: %s", err))
		os.Exit(1)
	}
}