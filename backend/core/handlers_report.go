package core

import (
	"fmt"
	"log/slog"
	"net/http"
)

// Build and return IncidentReport
func GetReportHandler(store IncidentStorage, log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger := log.With("component", "GetReportHandler")
		w.Header().Add("Content-Type", "application/json")

		severity := r.URL.Query().Get("severity")
		service := r.URL.Query().Get("service")

		incidents, err := store.GetAll(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": "failed to retrive incidents"}, "", logger)
			logger.Error(fmt.Sprintf("failed to get all incidents: %s", err))
			return
		}
		report, err := BuildReport(incidents)
		if err != nil {
			w.WriteHeader(http.StatusUnprocessableEntity)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("%s", err)}, "", logger)
			logger.Warn(fmt.Sprintf("failed to build incident report: %s", err))
			return
		}

		// Check if requested only groupped incidents by Severity. If so, return it.
		if severity != "" {
			_, exist := report.BySeverity[severity]
			if !exist {
				w.WriteHeader(http.StatusBadRequest)
				EncodeJSON(w, map[string]string{"message": "unknown severity"}, "", logger)
				logger.Error("unknown severity", "severity", severity)
				return
			} else {
				w.WriteHeader(http.StatusOK)
				EncodeJSON(w, report.BySeverity[severity], "", logger)
				logger.Debug("requested severity", "severity", severity)
				return
			}
		// Check if requested only groupped incidents by ServiceName. If so, return it.
		} else if service != "" {
			_, exist := report.ByServices[service]
			if !exist {
				w.WriteHeader(http.StatusBadRequest)
				EncodeJSON(w, map[string]string{"message": "unknown service name"}, "", logger)
				logger.Error("unknown service name", "name", service)
				return
			} else {
				w.WriteHeader(http.StatusOK)
				EncodeJSON(w, report.ByServices[service], "", logger)
				logger.Debug("requested severity", "name", service)
				return
			}
		}
		// Otherwise return whole report.
		EncodeJSON(w, report, "", logger)
		logger.Debug("successfully returned report")
	}
}