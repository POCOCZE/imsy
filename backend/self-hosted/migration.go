package main

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"log/slog"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

// Run database migrations using pressly/goose library
func RunDBMigration(ctx context.Context) error {
	if os.Getenv(EnvIncPgConn) == "" {
		return fmt.Errorf("[RunDBMigration] Postgres connection string is required to run database migrations. Mandatory env. var. %q", EnvIncPgConn)
	}
	log.Println("[RunDBMigration] Found pg conn string. Starting database migrations\n")
	
	// Open database and open migration files
	pgConn := os.Getenv(EnvIncPgConn)
	db, err := sql.Open("pgx", pgConn)
	if err != nil {
		return fmt.Errorf("[RunDBMigration] failed to open database connection: %s", err)
	}
	defer db.Close()

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
	defer provider.Close()

	applied, err := provider.Up(ctx)
	if err != nil {
		return fmt.Errorf("[RunDBMigration] failed to apply goose migrations: %s", err)
	}

	// print gathered info ot stdout
	for _, migration := range applied {
		slog.Info("[RunDBMigration] migration applied", "migration", migration.String())
	}

	slog.Info("[RunDBMigration] Database migrations completed successfully", "count", len(applied))
	return nil
}