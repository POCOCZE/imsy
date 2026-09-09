package core

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// type Incident struct {
// 	ID         string `json:"id" validate:"required"`
// 	Title      string `json:"title" validate:"required"`
// 	Severity   string `json:"severity" validate:"required"`
// 	ServiceName    string `json:"service_name" validate:"required"`
// 	StartedAt  *time.Time `json:"started_at" validate:"required"`
// 	ResolvedAt *time.Time `json:"resolved_at"`
// 	// Message	   string `json:"message"`
// 	// IsResolved bool `json:"is_resolved"`
// }

type Incident struct {
	ID          	uuid.UUID 	`json:"id"`
	OrgID       	uuid.UUID 	`json:"org_id"`
	Name        	string 		`json:"name" validate:"required"`
	NameBlindIdx 	string		`json:"name_blind_idx"`
	Title       	string 		`json:"title" validate:"required"`
	Severity    	string 		`json:"severity" validate:"required"`
	ServiceName 	string 		`json:"service_name" validate:"required"`
	StartedAt   	*time.Time 	`json:"started_at"`
	ResolvedAt  	*time.Time 	`json:"resolved_at"`
	CreatedBy   	uuid.UUID 	`json:"created_by"`
	CreatedAt   	*time.Time 	`json:"created_at"`
	UpdatedAt   	*time.Time 	`json:"updated_at"`
}

// type IncidentImportExport struct {
// 	Name        string 		`json:"name" validate:"required"`
// 	Title       string 		`json:"title" validate:"required"`
// 	Severity    string 		`json:"severity" validate:"required"`
// 	ServiceName string 		`json:"service_name" validate:"required"`
// 	StartedAt   *time.Time 	`json:"started_at" validate:"required"`
// 	ResolvedAt  *time.Time 	`json:"resolved_at"`
// }

type IncidentsFile struct {
	Incidents *[]Incident `json:"incidents"`
}

type IncidentReportDetails struct {
	Name	   string `json:"name"`
	Title      string `json:"title"`
	Severity   string `json:"severity,omitempty"`
	Service    string `json:"service_name,omitempty"`
}

type IncidentReport struct {
	IncidentsCount 		int                              	`json:"incidents_count"`
	UnresolvedNames  	[]string                         	`json:"unresolved_names"`
	MTTR           		string                             	`json:"mttr"`
	ByServices     		map[string][]IncidentReportDetails 	`json:"by_services"`
	BySeverity     		map[string][]IncidentReportDetails 	`json:"by_severity"`
	// ByID               map[string]IncidentReportDetails    `json:"by_id"`
}

type IncidentDuration struct {
	Seconds   float64
	HMSFormat string
}

type IncidentStorage interface {
	GetAll(ctx context.Context) (*[]Incident, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Incident, error)
	GetByName(ctx context.Context, name string) (*Incident, error)
	Add(ctx context.Context, incident *Incident) (int, uuid.UUID, error)
	AddList(ctx context.Context, incidents *[]Incident) (int, error)
	Edit(ctx context.Context, id uuid.UUID, incident *Incident) error
	DeleteByID(ctx context.Context, id uuid.UUID) error
	DeleteAll(ctx context.Context) error
}

// Shows what columns are actually encrypted
type EncIncidentCols struct {
	Name		string
	Title		string
	ServiceName	string
}