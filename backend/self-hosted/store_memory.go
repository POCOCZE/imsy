package main

import (
	"context"
	"fmt"
	"sync"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/pococze/imsy/backend/core"
)

// ! This file is meant only for development purposes and testing.
// ! Incidents that would be written into memory store will be lost after app restart.
// * Recommended is to use a postgresql database to make incidents persistent across restarts.

type MemoryStore struct {
    Mu sync.RWMutex
    Incidents []core.Incident
}

func NewMemoryStore() *MemoryStore {
    // This is constructor function
    return &MemoryStore{
        Incidents: make([]core.Incident, 0),
    }
}

func (m *MemoryStore) Add(ctx context.Context, incident *core.Incident) (int, uuid.UUID, error) {
	// Add write lock with mutex
	m.Mu.Lock()
	defer m.Mu.Unlock()

	// Todo: add UUID checking and generating like in Postgres store.
	validate := validator.New(validator.WithRequiredStructEnabled())
	err := validate.Struct(incident)
	if err != nil {
		return 0, uuid.Nil, err
	}

	// Check if the key already exist, this will prevent some bugs and errors
	var duplicateIncCount int
	for _, storedInc := range m.Incidents {
		// If incident already exist in slice - return error
		// ? Not sure whether there is more effective solution that could immidiately find the incident without relying on loops - I would need to switch to `map`, but this would result in incompatibilities...
		// ? I will keep it as it as, since Go is very fast.
		if storedInc.Name == incident.Name {
			duplicateIncCount = 1
			// return fmt.Errorf("error: incident already exist")
		}
	}

	incident.ID, err = uuid.NewV7()
	if err != nil {
		return 0, uuid.Nil, fmt.Errorf("[Add] failed to create new uuidv7")
	}
	incident.OrgID = incOrgID
	// set current time if startedAt is missing, since its optinal
	if incident.StartedAt == nil || incident.StartedAt.IsZero() {
		incident.StartedAt = CurrentUTCTime()
	}
	incident.CreatedBy = incUserID
	incident.CreatedAt = CurrentUTCTime()
	incident.UpdatedAt = CurrentUTCTime()

	// Append incident and rebuild report
	m.Incidents = append(m.Incidents, *incident)
	if _, err := core.BuildReport(&m.Incidents); err != nil {
		return 0, uuid.Nil, fmt.Errorf("error building report: %s", err)
	}
	return duplicateIncCount, uuid.Nil, nil
}

func (m *MemoryStore) AddList(ctx context.Context, incidents *[]core.Incident) (int, error) {
	var totalDuplicateCount int
	for _, incident := range *incidents {
		duplicateCount, _, err := m.Add(ctx, &incident)
		totalDuplicateCount += duplicateCount
		if err != nil {
			return 0, err
		}
	}
	return totalDuplicateCount, nil
}

// Edit incident; id - original incident ID; incident - changed incident struct; Users are not allowed to edit incident ID - returns error (frontend blocks the input field too to edit it)
func (m *MemoryStore) Edit(ctx context.Context, id uuid.UUID, incident *core.Incident) error {
	m.Mu.Lock()
	defer m.Mu.Unlock()

	// var isFound bool
	for i, inc := range m.Incidents {
		if inc.ID == id {
			// isFound = true

			// set required values before adding incident to slice			
			incident.ID = inc.ID
			incident.OrgID = inc.OrgID
			incident.Name = inc.Name
			// startedAt is guaranteed to not be a valid time
			incident.StartedAt = new(incident.StartedAt.UTC())

			if incident.ResolvedAt == nil || incident.ResolvedAt.IsZero() {
				incident.ResolvedAt = inc.ResolvedAt
			} else {
				incident.ResolvedAt = new(incident.ResolvedAt.UTC())
			}
			incident.CreatedBy = inc.CreatedBy
			incident.CreatedAt = inc.CreatedAt
			incident.UpdatedAt = CurrentUTCTime()

			m.Incidents[i] = *incident
			break
		}
	}
	// if isFound {
	// 	_, err := core.BuildReport(&m.Incidents)
	// 	if err != nil {
	// 		return err
	// 	}
	// } else {
	// 	return fmt.Errorf("incident %q not found", id)
	// }
	return nil
}

func (m *MemoryStore) GetAll(ctx context.Context) (*[]core.Incident, error) {
	incidents := m.Incidents
	return &incidents, nil
}

func (m *MemoryStore) GetByID(ctx context.Context, id uuid.UUID) (*core.Incident, error) {
	for _, inc := range m.Incidents {
		if inc.ID == id {
			return &inc, nil
		}
	}
	return nil, fmt.Errorf("incident ID %q not found", id)
}

func (m *MemoryStore) GetByName(ctx context.Context, name string) (*core.Incident, error) {
	for _, inc := range m.Incidents {
		if inc.Name == name {
			return &inc, nil
		}
	}
	return nil, fmt.Errorf("incident name %q not found", name)
}

func (m *MemoryStore) DeleteByID(ctx context.Context, id uuid.UUID) error {
	m.Mu.Lock()
	defer m.Mu.Unlock()

	var newIncidents []core.Incident
	var found bool
	for _, incident := range m.Incidents {
		if incident.ID == id {
			found = true
		} else {	
			newIncidents = append(newIncidents, incident)
		}
	}
	if found {
		// Set new incidents list and rebuild report
		m.Incidents = newIncidents
		// _, err := core.BuildReport(&m.Incidents)
		// if err != nil {
		// 	return err
		// }
	} else {
        err := fmt.Errorf("incident ID %q was not found", id)
        return err
    }
	return nil
}

func (m *MemoryStore) DeleteAll(ctx context.Context) error {
	m.Incidents = nil
	return nil
}