package core

import (
	"encoding/json"
	"log"
	"os"
)

// Open JSON file from input - file path
func (f *IncidentsFile) OpenInputFile(file string) {
    data, err := os.ReadFile(file)
    if err != nil {
        log.Fatalf("Error reading file: %s", err)
    }

    // Unmarshal encoded JSON data
    if err := json.Unmarshal(data, &f); err != nil {
        log.Fatalf("Error unmarshal JSON file: %s", err)
    }
}