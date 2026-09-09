package main

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

// Run database migrations using pressly/goose library
func RunDBMigration(ctx context.Context, logger *slog.Logger) (err error) {
	if os.Getenv(EnvIncPgConn) == "" {
		return fmt.Errorf("[RunDBMigration] Postgres connection string is required to run database migrations. Mandatory env. var. %q", EnvIncPgConn)
	}
	logger.Info("Found pg conn string. Starting database migrations", "func", "RunDBMigration")
	
	// Open database and open migration files
	pgConn := os.Getenv(EnvIncPgConn)
	db, err := sql.Open("pgx", pgConn)
	if err != nil {
		return fmt.Errorf("[RunDBMigration] failed to open database connection: %s", err)
	}
	defer func () {
		if closeErr := db.Close(); closeErr != nil {
			err = closeErr
		}
	}()

	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("[RunDBMigration] failed to ping database: %s", err)
	}
	migrationFS, err := fs.Sub(migrationFiles, "migrations")
	if err != nil {
		return fmt.Errorf("[RunDBMigration] failed to load migration files: %s", err)
	}

	// create Goose provider and apply migrations
	provider, err := goose.NewProvider(goose.DialectPostgres,
		db,
		migrationFS,
		goose.WithTableName("goose_db_version"),
	)
	if err != nil {
		return fmt.Errorf("[RunDBMigration] failed to create new goose provider: %s", err)
	}
	defer func() {
		if closeErr := provider.Close(); closeErr != nil {
			err = closeErr
		}
	}()

	applied, err := provider.Up(ctx)
	if err != nil {
		return fmt.Errorf("[RunDBMigration] failed to apply goose migrations: %s", err)
	}

	// print gathered info ot stdout
	for _, migration := range applied {
		slog.Info("migration applied", "func", "RunDBMigration", "migration", migration.String())
	}

	slog.Info("Database migrations completed successfully", "func", "RunDBMigration", "count", len(applied))
	return nil
}