package main

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pococze/imsy/backend/core"
	"github.com/pococze/imsy/backend/self-hosted/database"
)

type PostgresStore struct {
	Pool 	*pgxpool.Pool
	Logger	*slog.Logger
	Queries *database.Queries
	GCM		cipher.AEAD
	Enc		core.EncIncidentCols
}

func NewPostgresStore(ctx context.Context, connString string, logger *slog.Logger) (*PostgresStore, error) {
	pool, err := pgxpool.New(ctx, connString)
	if err != nil {
		return nil, fmt.Errorf("oppening database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("connecting to database: %w", err)
	}

	// prepare AES-GCM part
	encryptionKeyB64 := os.Getenv(EnvEncryptionKey)
	encryptionKey, err := base64.StdEncoding.DecodeString(encryptionKeyB64)
	if err != nil {
		log.Fatalf("failed to base64 decode string value with env var key %q", EnvTransportEncryptKey)
	}

	// build the GCM
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		log.Fatalf("[NewPostgresStore] failed to create new aes cipher: %s", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		log.Fatalf("[NewPostgresStore] failed to create new gcm: %s", err)
	}

	queries := database.New(pool)
	return &PostgresStore{
		Pool: pool,
		Logger: logger,
		Queries: queries,
		GCM: gcm,
	}, nil
}

func CurrentUTCTime() *time.Time {
	currentTime := time.Now().UTC()
	return &currentTime
}

func timeToPgTimestamptz(t *time.Time) pgtype.Timestamptz {
	if t == nil || t.IsZero() {
		return pgtype.Timestamptz{
			Time: time.Time{},
			InfinityModifier: 0,
			Valid: false, // This represents SQL NULL
		}
	}
	return pgtype.Timestamptz{
		Time: *t,
		InfinityModifier: 0,
		Valid: true,
	}
}

func pgTimestamptzToTime(pgTime pgtype.Timestamptz) *time.Time {
	if !pgTime.Valid || pgTime.Time.IsZero() {
		return nil
	}
	return &pgTime.Time
}

func UUIDToPgUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: id,
		Valid: id != uuid.Nil,
	}
}

func PgUUIDToUUID(pgUUID pgtype.UUID) (uuid.UUID, error) {
	if !pgUUID.Valid {
		return uuid.Nil, fmt.Errorf("uuid is not valid")
	}
	return pgUUID.Bytes, nil
}

func (p *PostgresStore) pgIncidentToIncident(pgIncident database.Incident) (*core.Incident, error) {
	incID, err := PgUUIDToUUID(pgIncident.ID)
	if err != nil {
		return nil, err
	}
	incOrgID, err := PgUUIDToUUID(pgIncident.OrgID)
	if err != nil {
		return nil, err
	}
	incNameBlindIdx, err := core.PgTextToString(pgIncident.NameBlindIdx)
	if err != nil {
		return nil, err
	}
	incCreatedBy, err := PgUUIDToUUID(pgIncident.CreatedBy)
	if err != nil {
		return nil, err
	}

	params := core.Incident{
		ID: incID,
		OrgID: incOrgID,
		Name: pgIncident.Name,
		NameBlindIdx: incNameBlindIdx,
		Title: pgIncident.Title,
		Severity: pgIncident.Severity,
		ServiceName: pgIncident.ServiceName,
		StartedAt: pgTimestamptzToTime(pgIncident.StartedAt),
		ResolvedAt: pgTimestamptzToTime(pgIncident.ResolvedAt),
		CreatedBy: incCreatedBy,
		CreatedAt: pgTimestamptzToTime(pgIncident.CreatedAt),
		UpdatedAt: pgTimestamptzToTime(pgIncident.UpdatedAt),
	}
	return &params, nil
}

func (p *PostgresStore) Add(ctx context.Context, incident *core.Incident) (int, uuid.UUID, error) {
	// Pre-check that incident fields (name, title, service_name) are 4 or more chars
	minFieldLength := 4
	checkFieldsLength := map[string]string{
		"Name": incident.Name,
		"Title": incident.Title,
		"Service name": incident.ServiceName,
	}

	for name, value := range checkFieldsLength {
		if len(value) < minFieldLength {
			return 0, uuid.Nil, fmt.Errorf("field %q is less than %v", name, minFieldLength)
		}
	}

	// check if incident already exist before adding.
	inc, err := p.GetByName(ctx, incident.Name)
	var id uuid.UUID
	if errors.Is(err, pgx.ErrNoRows) {
		p.Logger.Debug("got (errNoRows) adding unique incident: %s", err)
		// Incident does not exist - add it
		// Assign UUIDv7 if not already set
		// p.Logger.Debug("Got incidentID %q", incident.ID)
		if incident.ID == uuid.Nil {
			id, err = uuid.NewV7()
			if err != nil {
				return 0, uuid.Nil, fmt.Errorf("failed to generate UUIDv7: %s", err)
			}
			p.Logger.Debug("generated UUIDv7", "func", "Add", "name", id.String())
			incident.ID = id
		}
		// Assign OrgID if incident does not have it already (could have it in cases when importing a bunch of incidents from file)
		if incident.OrgID == uuid.Nil {
			p.Logger.Debug("setting incOrgID", "func", "Add", "name", incOrgID.String())
			incident.OrgID = incOrgID
		}
		// Assign current time to StartedAt field if empty
		if incident.StartedAt == nil || incident.StartedAt.IsZero() {
			p.Logger.Debug("setting current time to new incident for startedAt field", "func", "Add", "name", incident.ID.String())
			incident.StartedAt = CurrentUTCTime()
		}
		// Assign UserID to CreatedBy field
		if incident.CreatedBy == uuid.Nil {
			p.Logger.Debug("setting incUserID", "func", "Add", "name", incUserID.String())
			incident.CreatedBy = incUserID
		}
		// Assign current time to CreatedAt field if not exist
		if incident.CreatedAt == nil || incident.CreatedAt.IsZero() {
			p.Logger.Debug("setting current time to new incident for createdAt field", "func", "Add", "name", incident.ID.String())
			incident.CreatedAt = CurrentUTCTime()
		}
		// Assign current time to UpdatedAt field if not exist
		if incident.UpdatedAt == nil || incident.UpdatedAt.IsZero() {
			p.Logger.Debug("setting current time to new incident for updatedAt field", "func", "Add", "name", incident.ID.String())
			incident.UpdatedAt = CurrentUTCTime()
		}

		// create hash of incident name
		hmacKeyB64 := os.Getenv(EnvHMACEncryptKey)
		incident.NameBlindIdx = p.EncryptToHMAC(incident.Name, hmacKeyB64)

		encIncidentCols := p.EncryptIncidentCols(&core.EncIncidentCols{
			Name: incident.Name,
			Title: incident.Title,
			ServiceName: incident.ServiceName,
		})

		if err := p.Queries.Add(ctx, database.AddParams{
			ID: UUIDToPgUUID(incident.ID),
			OrgID: UUIDToPgUUID(incident.OrgID),
			Name: encIncidentCols.Name,
			// put the newly generated hash here
			NameBlindIdx: core.StringToPgText(incident.NameBlindIdx),
			Title: encIncidentCols.Title,
			Severity: incident.Severity,
			ServiceName: encIncidentCols.ServiceName,
			StartedAt: timeToPgTimestamptz(incident.StartedAt),
			ResolvedAt: timeToPgTimestamptz(incident.ResolvedAt),
			CreatedBy: UUIDToPgUUID(incident.CreatedBy),
			CreatedAt: timeToPgTimestamptz(incident.CreatedAt),
			UpdatedAt: timeToPgTimestamptz(incident.UpdatedAt),
		}); err != nil {
			return 0, uuid.Nil, fmt.Errorf("[Add] failed to add incident: %s", err)
		}
		return 0, id, nil
	}
	if err != nil {
		return 0, uuid.Nil, fmt.Errorf("[Add] failed to add incident: %s", err)
	}

	var duplicateCount int
	// Must check for names because UUIDs are meant to be unique
	if inc.Name == incident.Name {
		p.Logger.Debug("found duplicate incident", "func", "Add", "name", inc.Name)
		duplicateCount = 1
		p.Logger.Warn("skipping incident that already exist", "func", "Add", "name", incident.Name)
	}
	return duplicateCount, id, nil
}

func(p *PostgresStore) AddList(ctx context.Context, incidents *[]core.Incident) (int, error) {
	var totalDuplicateCount int
	for _, incident := range *incidents {
		duplicateCount, _, err := p.Add(ctx, &incident)
		totalDuplicateCount += duplicateCount
		if err != nil {
			return 0, err
		}
	}
	return totalDuplicateCount, nil
}

func(p *PostgresStore) Edit(ctx context.Context, id uuid.UUID, incident *core.Incident) error {
	inc, err := p.GetByID(ctx, id)
	if err != nil {
		return err
	}

	encIncidentCols := p.EncryptIncidentCols(&core.EncIncidentCols{
		// restrict chanding incident name
		Name: inc.Name,
		Title: incident.Title,
		ServiceName: incident.ServiceName,
	})

	if err := p.Queries.Edit(ctx, database.EditParams{
		ID: UUIDToPgUUID(inc.ID),
		OrgID: UUIDToPgUUID(inc.OrgID),
		Name: encIncidentCols.Name,
		// Incident's name cannot be changed anyway, so no need to compute the hash again.
		NameBlindIdx: core.StringToPgText(inc.NameBlindIdx),
		Title: encIncidentCols.Title,
		Severity: incident.Severity,
		ServiceName: encIncidentCols.ServiceName,
		// restrict changing StartedAt 
		StartedAt: timeToPgTimestamptz(inc.StartedAt),
		ResolvedAt: timeToPgTimestamptz(incident.ResolvedAt),
		CreatedBy: UUIDToPgUUID(inc.CreatedBy),
		CreatedAt: timeToPgTimestamptz(inc.CreatedAt),
		UpdatedAt: timeToPgTimestamptz(CurrentUTCTime()),
		// This represents incident UUID to edit - the rest of variables above are values to replace the original incident that user wants to edit.
		ID_2: UUIDToPgUUID(id),
	}); err != nil {
		return err
	}
	return nil
}

func (p *PostgresStore) GetAll(ctx context.Context) (*[]core.Incident, error) {
	pgIncidents, err := p.Queries.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	var incidents []core.Incident
	for _, pgIncident := range pgIncidents {
		inc, err := p.pgIncidentToIncident(pgIncident)
		if err != nil {
			return nil, fmt.Errorf("failed to convert PG incident to incident: %s", err)
		}

		decIncidentCols, err := p.DecIncidentCols(&core.EncIncidentCols{
			Name: inc.Name,
			Title: inc.Title,
			ServiceName: inc.ServiceName,
		})
		if err != nil {
			return nil, fmt.Errorf("[GetAll] failed to get incidents: %s", err)
		}
		inc.Name = decIncidentCols.Name
		inc.Title = decIncidentCols.Title
		inc.ServiceName = decIncidentCols.ServiceName

		incidents = append(incidents, *inc)
	}
	return &incidents, nil
}

func (p *PostgresStore) GetByID(ctx context.Context, id uuid.UUID) (*core.Incident, error) {
	pgIncident, err := p.Queries.GetByID(ctx, UUIDToPgUUID(id))
	if err != nil {
		// Return error, most of the time it will be ErrNoRows. When such error occurs, it's sure that such incident is unique thus can be added / edited
		return nil, err
	}
	inc, err := p.pgIncidentToIncident(pgIncident)
	if err != nil {
		return nil, fmt.Errorf("failed to convert PG incident to incident: %s", err)
	}

	decIncidentCols, err := p.DecIncidentCols(&core.EncIncidentCols{
		Name: inc.Name,
		Title: inc.Title,
		ServiceName: inc.ServiceName,
	})
	if err != nil {
		return nil, fmt.Errorf("[GetAll] failed to get incidents: %s", err)
	}
	inc.Name = decIncidentCols.Name
	inc.Title = decIncidentCols.Title
	inc.ServiceName = decIncidentCols.ServiceName

	return inc, nil
}

// Search whether incident's name exist. Names are unique so expect one row or nothing. Name will be converted into a hash and then compred with database column because 'name' column is encrypted by default.
func (p *PostgresStore) GetByName(ctx context.Context, name string) (*core.Incident, error) {
	// compares HMAC keys. Incident's name cannot be directly compared because its encrypted. Every encryption is unique to direct comparing is not possible. Thus we compare two hashed value - one is already in database, and we are comparing it with the incident's name that we wanna get more info.
	hmacKeyB64 := os.Getenv(EnvHMACEncryptKey)
	hmacNameB64 := p.EncryptToHMAC(name, hmacKeyB64)
	pgIncident, err := p.Queries.GetByName(ctx, core.StringToPgText(hmacNameB64))
	if err != nil {
		return nil, err
	}
	inc, err := p.pgIncidentToIncident(pgIncident)
	if err != nil {
		return nil, fmt.Errorf("failed to convert PG incident to incident: %s", err)
	}

	decIncidentCols, err := p.DecIncidentCols(&core.EncIncidentCols{
		Name: inc.Name,
		Title: inc.Title,
		ServiceName: inc.ServiceName,
	})
	if err != nil {
		return nil, fmt.Errorf("[GetAll] failed to get incidents: %s", err)
	}
	inc.Name = decIncidentCols.Name
	inc.Title = decIncidentCols.Title
	inc.ServiceName = decIncidentCols.ServiceName

	return inc, nil
}

func (p *PostgresStore) DeleteByID(ctx context.Context, id uuid.UUID) error {
	err := p.Queries.DeleteByID(ctx, UUIDToPgUUID(id))
	if err != nil {
		return err
	}

	// // Get All incidents to satisfy function - rebuild report
	// incidents, err := p.GetAll(ctx)
	// if err != nil {
	// 	return err
	// }
	// if _, err := core.BuildReport(incidents); err != nil {
	// 	return err
	// }
	return nil
}

func (p *PostgresStore) DeleteAll(ctx context.Context) error {
	// !This removes everything from the database forever!
	err := p.Queries.DeleteAll(ctx)
	if err != nil {
		return err
	}
	return nil
}