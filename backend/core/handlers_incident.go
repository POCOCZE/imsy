package core

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/google/uuid"
)

// Add Slice of incidents to selected store.
func AddListHandler(store IncidentStorage, logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var incidents *IncidentsFile
		err := json.NewDecoder(r.Body).Decode(&incidents)
		w.Header().Set("Content-Type", "application/json")

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("failed to decode JSON: %s", err)}, "")
			logger.Error("failed to decode JSON", "error", err, "func", "AddListHandler")
			return
		}
		// Guard that checks if user sent correct incidents body structure
		incidentsFileLength := len(*incidents.Incidents)
		if incidentsFileLength == 0 {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": "no incidents provided. did you specified correct endpoint?"}, "")
			logger.Error("user tried to write 0 incidents. Maybe he specificed bad endpoint.", "func", "AddListHandler")
			return
		}
		totalDuplicateCount, err := store.AddList(r.Context(), incidents.Incidents)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("failed to add multiple incidents: %s", err)}, "")
			logger.Error("failed to add multiple incidents", "error", err, "func", "AddListHandler")
			return
		}
		uniqueIncCount := incidentsFileLength - totalDuplicateCount
		w.WriteHeader(http.StatusCreated)
		if uniqueIncCount == 0 {
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("skipping %v duplicate incidents", incidentsFileLength)}, "")
			logger.Debug("skipping duplicate incidents", "count", incidentsFileLength, "func", "AddListHandler")
			return
		}
		EncodeJSON(w, map[string]string{"message": fmt.Sprintf("added %v unique out of %v incidents", uniqueIncCount, incidentsFileLength)}, "")
		logger.Debug("added unique incidents", "count", uniqueIncCount, "max", incidentsFileLength, "func", "AddListHandler")
	}
}

// Add one incident to Store
func AddHandler(store IncidentStorage, logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var incident *Incident
		err := json.NewDecoder(r.Body).Decode(&incident)

		w.Header().Add("Content-Type", "application/json")
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": "invalid JSON"}, "Error occured while encoding JSON")
			logger.Error("failed to encode JSON", "error", err, "func", "AddHandler")
			return
		}

		totalDuplicateCount, _, err := store.Add(r.Context(), incident)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("failed to add incident %s: %s", incident.Name, err)}, "")
			logger.Error("failed to add one incident", "error", err, "func", "AddHandler")
			return
		}
		w.WriteHeader(http.StatusOK)
		if totalDuplicateCount != 0 {
			EncodeJSON(w, map[string]string{"info": fmt.Sprintf("skipping duplicate incident %v", incident.Name)}, "")
			logger.Debug("skipping duplicate incident", "name", incident.Name, "func", "AddHandler")
			return
		}
		EncodeJSON(w, map[string]string{"message": fmt.Sprintf("added new unique incident: %v", incident.Name)}, "")
		logger.Debug("added new unique incident", "name", incident.Name, "func", "AddHandler")
	}
}

// Edit one particular incident, updated incident is in the request body.
func EditHandler(store IncidentStorage, logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		var incident *Incident
		id := r.PathValue("id")
		uuid, err := uuid.Parse(id)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logger.Error("failed to parse string to UUIDv7", "error", err, "func", "EditHandler")
			return
		}
		if err := json.NewDecoder(r.Body).Decode(&incident); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logger.Error("failed to decode request body", "error", err, "func", "EditHandler")
			return
		}
		if err := store.Edit(r.Context(), uuid, incident); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("failed to edit incident %s", incident.Name)}, "")
			logger.Error("failed to edit incident", "error", err, "func", "EditHandler")
			return
		}
		w.WriteHeader(http.StatusOK)
		EncodeJSON(w, map[string]string{"message": fmt.Sprintf("successfully edited incident %s", incident.Name)}, "")
		logger.Info("successfully edited incident", "id", id, "func", "EditHandler")
	}
}

// Return details of requested incident.
func GetByIDHandler(store IncidentStorage, logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		id := r.PathValue("id")
		uuid, err := uuid.Parse(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			logger.Error("failed to parse string to UUIDv7", "error", err, "func", "GetByIDHandler")
			return
		}
		inc, err := store.GetByID(r.Context(), uuid)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("failed to get incident: %s", err)}, "")
			logger.Error("failed to get incident", "id", id, "error", err, "func", "GetByIDHandler")
			return
		}
		w.WriteHeader(http.StatusOK)
		EncodeJSON(w, inc, "")
		logger.Info("requested incident", "id", inc.ID.String(), "func", "GetByIDHandler")
	}
}

// Return details of all incidents.
func GetAllHandler(store IncidentStorage) http.HandlerFunc{
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		incidents, err := store.GetAll(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("failed to get incidents: %s", err)}, "")
			return
		}
		w.WriteHeader(http.StatusOK)
		EncodeJSON(w, incidents, "")
	}
}

// Delete one particular incident.
func DeleteByIDHandler(store IncidentStorage, logger *slog.Logger) http.HandlerFunc{
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("content-Type", "application/json")
		id := r.PathValue("id")
		uuid, err := uuid.Parse(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			logger.Error("failed to parse string to UUIDv7", "error", err, "func", "DeleteByIDHandler")
			return
		}

		if err := store.DeleteByID(r.Context(), uuid); err != nil {
			w.WriteHeader(http.StatusNotFound)
			EncodeJSON(w, map[string]string{"message": fmt.Sprintf("incident ID %s not found", id)}, "")
			logger.Warn("incident not found", "id", id, "func", "DeleteByIDHandler")
			return
		}
		w.WriteHeader(http.StatusOK)
		EncodeJSON(w, map[string]string{"message": fmt.Sprintf("deleted incident ID %s", id)}, "")
		logger.Info("successfully deleted incident", "id", id, "func", "DeleteByIDHandler")
	}
}

// WARNING! Deletes all incidents.
func DeleteAllHandler(store IncidentStorage, logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		err := store.DeleteAll(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			EncodeJSON(w, map[string]string{"error": fmt.Sprintf("%s", err)}, "")
			return
		}
		w.WriteHeader(http.StatusOK)
		EncodeJSON(w, map[string]string{"message": "deleted all incidents"}, "")
		logger.Debug("deleted all incidents", "func", "DeleteAllHandler")
	}
}