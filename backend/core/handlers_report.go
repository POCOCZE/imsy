package core

import (
	"fmt"
	"log/slog"
	"net/http"
)

// Build and return IncidentReport
func GetReportHandler(store IncidentStorage, logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		severity := r.URL.Query().Get("severity")
		service := r.URL.Query().Get("service")
		// id := r.URL.Query().Get("id")
		w.Header().Add("Content-Type", "application/json")
		incidents, err := store.GetAll(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("%s", err)}, "")
			// log.Printf("%s", err)
			logger.Error("failed to get all incidents", "error", err, "func", "GetReportHandler")
			return
		}
		report, err := BuildReport(incidents)
		if err != nil {
			w.WriteHeader(http.StatusUnprocessableEntity)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("%s", err)}, "")
			logger.Error("failed to build incident report", "error", err, "func", "GetReportHandler")
			return
		}

		// Check if requested only groupped incidents by Severity. If so, return it.
		if severity != "" {
			_, exist := report.BySeverity[severity]
			if !exist {
				w.WriteHeader(http.StatusBadRequest)
				EncodeJSON(w, map[string]string{"message": fmt.Sprintf("severity %s does not exist", severity)}, "")
				logger.Error("severity does not exist", "name", severity, "func", "GetReportHandler")
				return
			} else {
				w.WriteHeader(http.StatusOK)
				EncodeJSON(w, report.BySeverity[severity], "")
				logger.Info("requested severity", "name", severity, "func", "GetReportHandler")
				return
			}
		// Check if requested only groupped incidents by ServiceName. If so, return it.
		} else if service != "" {
			_, exist := report.ByServices[service]
			if !exist {
				w.WriteHeader(http.StatusBadRequest)
				EncodeJSON(w, map[string]string{"message": fmt.Sprintf("service %s does not exist", service)}, "")
				logger.Error("service does not exist", "name", service, "func", "GetReportHandler")
				return
			} else {
				w.WriteHeader(http.StatusOK)
				EncodeJSON(w, report.ByServices[service], "")
				logger.Info("requested severity", "name", service, "func", "GetReportHandler")
				return
			}
		// Otherwise return whole report.
		} else {
			w.WriteHeader(http.StatusOK)
			EncodeJSON(w, report, "")
			logger.Debug("requested all incidents", "func", "GetReportHandler")
		}
	}
}