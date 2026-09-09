package main

import (
	"context"
	"log"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pococze/imsy/backend/core"
)

// * Create dummy organizations and user
var incOrgID uuid.UUID
var incUserID uuid.UUID
var isDevModeOn bool

var (
    EnvIncOrgID = "INC_ORG_ID"
    EnvIncUserID = "INC_USER_ID"
    EnvIncPgConn = "INC_DB_CONN"
    EnvIncHTTPPort = "INC_HTTP_PORT"
    EnvIncDevMode = "INC_DEV_MODE"
    EnvEncryptionKey = "ENCRYPTION_KEY"
    EnvTransportEncryptKey = "TRANSPORT_ENCRYPTION_KEY"
    EnvHMACEncryptKey = "HMAC_ENCRYPTION_KEY"
)

// Setting environemnt variables is optional, but recommended because every app startup generates new UUIDs when env. vars not specified. When no env vars in UUIDv7 format is provided, it will be generated. Generated UUIDs are printed.
func checkEnvironmentVariables(logger *slog.Logger) {
    var err error
    // Check OrgID
    incOrgIDStr, orgExist := os.LookupEnv(EnvIncOrgID)
    if !orgExist {
        incOrgID, err = uuid.NewV7()
        if err != nil {
            log.Fatalf("failed to create UUIDv7: %s", err)
        }
        // logger.Info("system generated UUIDv7")
        logger.Info("system generated organization (orgID)", "id", incOrgID.String())
    } else {
        incOrgID, err = uuid.Parse(incOrgIDStr)
        if err != nil {
            log.Fatalf("failed to parse string to UUID: %s", err)
        }
        // logger.Info("✓ found %q env var", EnvIncOrgID)
    }

    // Check UserID
    incUserIDStr, userExist := os.LookupEnv(EnvIncUserID)
    if !userExist {
        incUserID, err = uuid.NewV7()
        if err != nil {
            log.Fatalf("failed to create UUIDv7: %s", err)
        }
        logger.Info("system generated user (userID)", "id", incUserID.String())
    } else {
        incUserID, err = uuid.Parse(incUserIDStr)
        if err != nil {
            log.Fatalf("failed to parse string to UUID: %s", err)
        }
        // logger.Info("✓ found %q env var", EnvIncUserID)
    }

    // Check for development mode
    isDevModeOnStr, exist := os.LookupEnv(EnvIncDevMode)
    if !exist {
        logger.Info("dev flag not speficied. running normal mode.", "flag", EnvIncDevMode)
        isDevModeOn = false
    } else {
        if strings.ToLower(isDevModeOnStr) == "false" {
            isDevModeOn = false
        } else if strings.ToLower(isDevModeOnStr) == "true" {
            isDevModeOn = true
        } else {
            logger.Error("unrecognized env var value. expected boolean.", "flag", EnvIncDevMode)
            os.Exit(1)
        }
    }

    // Check Postgres Conn string
    _, exist = os.LookupEnv(EnvIncPgConn)
    if !exist && !isDevModeOn {
        logger.Error("postgres env var not found. format: postgres://user:pass@address:5432/db_name.", "flag", EnvIncPgConn)
        os.Exit(1)
    }
    // } else if exist {
    //     logger.Info("✓ found %q env var", EnvIncPgConn)
    // }

    // Check HTTP port
    _, exist = os.LookupEnv(EnvIncHTTPPort)
    if !exist {
        logger.Warn("http port env var not found. using port :8080.", "flag", EnvIncHTTPPort)
    }
    // } else {
    //     logger.Info("✓ found %q env var", EnvIncHTTPPort)
    // }

    // Check encryption key
    _, exist = os.LookupEnv(EnvEncryptionKey)
    if !exist {
        logger.Warn("encryption key env var not found.", "flag", EnvEncryptionKey)
    }
    // } else {
    //     logger.Info("✓ found %q env var", EnvEncryptionKey)
    // }

    // Check transport encrypt key
    _, exist = os.LookupEnv(EnvTransportEncryptKey)
    if !exist {
        logger.Warn("transport encrypt key env var not found.", "flag", EnvTransportEncryptKey)
    }
    // } else {
    //     logger.Info("✓ found %q env var", EnvTransportEncryptKey)
    // }

    // Check HMAC encryption key
    _, exist = os.LookupEnv(EnvHMACEncryptKey)
    if !exist {
        logger.Warn("HMAC encryption key env var not found.", "flag", EnvHMACEncryptKey)
    }
    // } else {
    //     logger.Info("✓ found %q env var", EnvHMACEncryptKey)
    // }
    logger.Info("✓ environment variable check executed successfully")
}

func main() {
    // logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
    // logger := slog.Default()

    // Todo: add env. var for severity level
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    }))
    slog.SetDefault(logger)

	logger.Info("+-----------------------+")
	logger.Info("| Built by PradkaDotDev |")
	logger.Info("+-----------------------+")
	logger.Info("|  More on: pradka.dev  |")
	logger.Info("+-----------------------+")
    logger.Info("")

    // Create context - mainly for database timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if len(os.Args) > 1 && os.Args[1] == "migrate" {
        if err := RunDBMigration(ctx, logger); err != nil {
            log.Fatalf("Failed to run DB migration: %s", err)
        }
        os.Exit(0)
    }

    checkEnvironmentVariables(logger)

    var store core.IncidentStorage
    pgConn := os.Getenv(EnvIncPgConn)
    if pgConn != "" && !isDevModeOn {
        var err error
        logger.Info("using database...")
        store, err = NewPostgresStore(ctx, pgConn, logger)
        if err != nil {
            log.Fatalf("ERR: %s", err)
        }
        logger.Info("✓ successfully connected to database")
    // Run development mode if postgres connection string is not specified and '-dev' parameter is specified.
    } else if isDevModeOn {
        // * In memory store - after restart, everything is gone. Used only for testing and development purposes!
        store = NewMemoryStore()
        logger.Info("")
        logger.Info("+---------------------------------------+")
        logger.Info("|   !!! RUNNING DEVELOPMENT MODE !!!    |")
        logger.Info("+---------------------------------------+")
        logger.Info("| !!! RESTART REMOVES ALL INCIDENTS !!! |")
        logger.Info("+---------------------------------------+")
        logger.Info("")
    } else {
        log.Fatalf("error: cannot speficy development mode and postgres conn string.\n\nquitting immidiately.")
    }

    // Start HTTP server on specified port
    httpPort := os.Getenv(EnvIncHTTPPort)
    if httpPort == "" {
        httpPort = "8080"
    }
    core.StartServer(httpPort, store, logger)
}