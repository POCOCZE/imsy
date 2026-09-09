package core

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// Prints report as JSON
// MarshalIndent automatically sorts alphabetically
// Output is []byte type that needs to be further processed
func serveJsonOutput(report *IncidentReport) []byte {
    jsonData, err := json.MarshalIndent(report, "", "  ")
    if err != nil {
        log.Fatalf("Error: Can't marshal indent data: %s", err)
    }

    return jsonData
}

// Deprecated: Prints whole incident report. This is used for CLI purposes. Used as CLI output.
func PrintReport(output string, report *IncidentReport) (err error) {
    if output == "stdout" {
        jsonData := serveJsonOutput(report)
        fmt.Println(string(jsonData))
    } else {
        file, err := os.Create(output)
        if err != nil {
            return fmt.Errorf("error creating output file: %s", err)
        }
        defer func() {
            if closeErr := file.Close(); closeErr != nil {
                err = closeErr
            }
        }()

        jsonData := serveJsonOutput(report)
        if _, err := file.Write(jsonData); err != nil {
            return fmt.Errorf("error writing report to output file: %s", err)
        }
        return err
    }
    return nil
}
