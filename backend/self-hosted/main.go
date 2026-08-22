package main

import (
	"context"
	"log"
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
func checkEnvironmentVariables() {
    var err error
    // Check OrgID
    incOrgIDStr, orgExist := os.LookupEnv(EnvIncOrgID)
    if !orgExist {
        incOrgID, err = uuid.NewV7()
        if err != nil {
            log.Fatalf("failed to create UUIDv7: %s", err)
        }
        log.Printf("system generated UUIDv7:")
        log.Printf("orgID: %s\n", incOrgID.String())
    } else {
        incOrgID, err = uuid.Parse(incOrgIDStr)
        if err != nil {
            log.Fatalf("failed to parse string to UUID: %s", err)
        }
        log.Printf("✓ found %q env var", EnvIncOrgID)
    }

    // Check UserID
    incUserIDStr, userExist := os.LookupEnv(EnvIncUserID)
    if !userExist {
        incUserID, err = uuid.NewV7()
        if err != nil {
            log.Fatalf("failed to create UUIDv7: %s", err)
        }
        log.Printf("userID: %s\n", incUserID.String())
    } else {
        incUserID, err = uuid.Parse(incUserIDStr)
        if err != nil {
            log.Fatalf("failed to parse string to UUID: %s", err)
        }
        log.Printf("✓ found %q env var", EnvIncUserID)
    }

    // Check for development mode
    isDevModeOnStr, exist := os.LookupEnv(EnvIncDevMode)
    if !exist {
        log.Printf("dev flag %q not speficied. running normal mode.", EnvIncDevMode)
        isDevModeOn = false
    } else {
        if strings.ToLower(isDevModeOnStr) == "false" {
            isDevModeOn = false
        } else if strings.ToLower(isDevModeOnStr) == "true" {
            isDevModeOn = true
        } else {
            log.Fatalf("unrecognized env var value for %q. expected boolean.", EnvIncDevMode)
        }
    }

    // Check Postgres Conn string
    _, exist = os.LookupEnv(EnvIncPgConn)
    if !exist && !isDevModeOn {
        log.Fatalf("postgres env var %q not found. format: postgres://user:pass@address:5432/db_name.", EnvIncPgConn)
    } else if exist {
        log.Printf("✓ found %q env var", EnvIncPgConn)
    }

    // Check HTTP port
    _, exist = os.LookupEnv(EnvIncHTTPPort)
    if !exist {
        log.Printf("http port env var %q not found. using port :8080.", EnvIncHTTPPort)
    } else {
        log.Printf("✓ found %q env var", EnvIncHTTPPort)
    }

    // Check encryption key
    _, exist = os.LookupEnv(EnvEncryptionKey)
    if !exist {
        log.Printf("encryption key env var %q not found.", EnvEncryptionKey)
    } else {
        log.Printf("✓ found %q env var", EnvEncryptionKey)
    }

    // Check transport encrypt key
    _, exist = os.LookupEnv(EnvTransportEncryptKey)
    if !exist {
        log.Printf("transport encrypt key env var %q not found.", EnvTransportEncryptKey)
    } else {
        log.Printf("✓ found %q env var", EnvTransportEncryptKey)
    }

    // Check HMAC encryption key
    _, exist = os.LookupEnv(EnvHMACEncryptKey)
    if !exist {
        log.Printf("HMAC encryption key env var %q not found.", EnvHMACEncryptKey)
    } else {
        log.Printf("✓ found %q env var", EnvHMACEncryptKey)
    }
}

func main() {
	log.Println("+-----------------------+")
	log.Println("| Built by PradkaDotDev |")
	log.Println("+-----------------------+")
	log.Println("|  More on: pradka.dev  |")
	log.Println("+-----------------------+")
    log.Println("")

    checkEnvironmentVariables()

    // Create context - mainly for database timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    var store core.IncidentStorage
    pgConn := os.Getenv(EnvIncPgConn)
    if pgConn != "" && !isDevModeOn {
        var err error
        log.Println("using database...")
        store, err = NewPostgresStore(ctx, pgConn)
        if err != nil {
            log.Fatalf("ERR: %s", err)
        }
        log.Println("✓ successfully connected to database")
    // Run development mode if postgres connection string is not specified and '-dev' parameter is specified.
    } else if isDevModeOn {
        // * In memory store - after restart, everything is gone. Used only for testing and development purposes!
        store = NewMemoryStore()
        log.Println("+---------------------------------------+")
        log.Println("|   !!! RUNNING DEVELOPMENT MODE !!!    |")
        log.Println("+---------------------------------------+")
        log.Println("| !!! RESTART REMOVES ALL INCIDENTS !!! |")
        log.Println("+---------------------------------------+")
        log.Println("")
    } else {
        log.Fatalf("error: cannot speficy development mode and postgres conn string.\n\nquitting immidiately.")
    }

    // Start HTTP server on specified port
    httpPort := os.Getenv(EnvIncHTTPPort)
    if httpPort == "" {
        httpPort = "8080"
    }
    core.StartServer(httpPort, store)
}