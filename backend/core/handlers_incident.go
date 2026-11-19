package core

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/google/uuid"
)

// Add Slice of incidents to selected store.
func AddListHandler(store IncidentStorage, log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger := log.With("component", "AddListHandler")
		var incidents *IncidentsFile
		err := json.NewDecoder(r.Body).Decode(&incidents)
		w.Header().Set("Content-Type", "application/json")

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("failed to decode JSON: %s", err)}, "", logger)
			logger.Error(fmt.Sprintf("failed to decode JSON: %s", err))
			return
		}
		// Guard that checks if user sent correct incidents body structure
		incidentsCount := len(*incidents.Incidents)
		if incidentsCount == 0 {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": "no incidents provided. did you specified correct endpoint?"}, "", logger)
			logger.Error("user tried to write 0 incidents. Maybe he specificed bad endpoint.")
			return
		}
		totalDuplicateCount, err := store.AddList(r.Context(), incidents.Incidents)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("failed to add multiple incidents: %s", err)}, "", logger)
			logger.Error(fmt.Sprintf("failed to add multiple incidents: %s", err))
			return
		}
		uniqueIncCount := incidentsCount - totalDuplicateCount
		w.WriteHeader(http.StatusCreated)
		if uniqueIncCount == 0 {
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("skipping %v duplicate incidents", incidentsCount)}, "", logger)
			logger.Debug("skipping duplicate incidents", "count", incidentsCount)
			return
		}
		EncodeJSON(w, map[string]string{"message": fmt.Sprintf("added %v unique out of %v incidents", uniqueIncCount, incidentsCount)}, "", logger)
		logger.Debug("added unique incidents", "count", uniqueIncCount, "max", incidentsCount)
	}
}

// Add one incident to Store
func AddHandler(store IncidentStorage, log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger := log.With("component", "AddHandler")
		w.Header().Add("Content-Type", "application/json")

		var incident *Incident
		err := json.NewDecoder(r.Body).Decode(&incident)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": "invalid JSON"}, "Error occured while encoding JSON", logger)
			logger.Error(fmt.Sprintf("failed to encode JSON: %s", err))
			return
		}

		duplicates, _, err := store.Add(r.Context(), incident)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("failed to add incident: %s", err)}, "", logger)
			logger.Error(fmt.Sprintf("failed to add one incident: %s", err))
			return
		}

		if duplicates != 0 {
			EncodeJSON(w, map[string]string{"info": "skipping duplicate incident"}, "", logger)
			logger.Debug("skipping duplicate incident", "name", incident.ID.String())
			return
		}
		EncodeJSON(w, map[string]string{"message": "added new unique incident"}, "", logger)
		logger.Debug("added new unique incident", "incident", incident.ID.String())
	}
}

// Edit one particular incident, updated incident is in the request body.
func EditHandler(store IncidentStorage, log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger := log.With("component", "EditHandler")
		w.Header().Add("Content-Type", "application/json")

		id := r.PathValue("id")
		uuid, err := uuid.Parse(id)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logger.Error(fmt.Sprintf("failed to parse string to UUIDv7: %s", err))
			return
		}

		var incident *Incident
		if err := json.NewDecoder(r.Body).Decode(&incident); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logger.Error(fmt.Sprintf("failed to decode request body: %s", err))
			return
		}

		if err := store.Edit(r.Context(), uuid, incident); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": "failed to edit incident"}, "", logger)
			logger.Error(fmt.Sprintf("failed to edit incident: %s", err))
			return
		}
		EncodeJSON(w, map[string]string{"message": "Success !"}, "", logger)
		logger.Info("successfully edited incident", "incident", id)
	}
}

// Return details of requested incident.
func GetByIDHandler(store IncidentStorage, log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger := log.With("component", "GetByIDHandler")
		w.Header().Add("Content-Type", "application/json")

		id := r.PathValue("id")
		uuid, err := uuid.Parse(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			logger.Error(fmt.Sprintf("failed to parse string to UUIDv7: %s", err))
			return
		}
		inc, err := store.GetByID(r.Context(), uuid)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": "failed to get incident"}, "", logger)
			logger.Error(fmt.Sprintf("failed to retrive one incident from database: %s", err), "incident", inc.ID.String())
			return
		}
		EncodeJSON(w, inc, "", logger)
		logger.Debug("returned one incident", "incident", inc.ID.String())
	}
}

// Return details of all incidents.
func GetAllHandler(store IncidentStorage, log *slog.Logger) http.HandlerFunc{
	return func(w http.ResponseWriter, r *http.Request) {
		logger := log.With("component", "GetAllHandler")
		w.Header().Set("Content-Type", "application/json")

		incidents, err := store.GetAll(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("failed to get incidents: %s", err)}, "", logger)
			return
		}
		EncodeJSON(w, incidents, "", logger)
		logger.Info("returned all incidents", "couint", len(*incidents))
	}
}

// Delete one particular incident.
func DeleteByIDHandler(store IncidentStorage, log *slog.Logger) http.HandlerFunc{
	return func(w http.ResponseWriter, r *http.Request) {
		logger := log.With("component", "DeleteByIDHandler")
		w.Header().Add("content-Type", "application/json")

		id := r.PathValue("id")
		uuid, err := uuid.Parse(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			logger.Error("failed to parse string to UUIDv7", "error", err)
			return
		}

		if err := store.DeleteByID(r.Context(), uuid); err != nil {
			w.WriteHeader(http.StatusNotFound)
			EncodeJSON(w, map[string]string{"message": "incident not found"}, "", logger)
			logger.Warn("incident not found", "id", id)
			return
		}
		EncodeJSON(w, map[string]string{"message": "Success !"}, "", logger)
		logger.Info("successfully deleted incident", "incident", id)
	}
}

// WARNING! Deletes all incidents.
func DeleteAllHandler(store IncidentStorage, log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger := log.With("component", "DeleteAllHandler")
		w.Header().Add("Content-Type", "application/json")

		err := store.DeleteAll(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"error": "error occured"}, "", logger)
			logger.Error(fmt.Sprintf("failed to delete all incidents: %s", err))
			return
		}
		EncodeJSON(w, map[string]string{"message": "Success !"}, "", logger)
		logger.Info("deleted all incidents")
	}
}