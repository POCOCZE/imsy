package main

import (
	"testing"

	"github.com/pococze/imsy/backend/core"
)

func TestMTTRSec(t *testing.T) {
	report := &core.IncidentReport{
		IncidentsCount: 4,
        UnresolvedNames: []string{"Incident1", "Incident2"},
        MTTR: "",
	}

    duration := map[string]core.IncidentDuration{
        "Incident1": {Seconds: 10, HMSFormat: "0m10s"},
        "Incident2": {Seconds: 10, HMSFormat: "0m10s"},
    }

    err := report.CalcMTTRSec(duration)
    if err != nil {
        t.Errorf("%s", err)
    }
    got := report.MTTR
    // 20 / 2 = 10s as MTTR
    want := "10s"
    if got != want {
        t.Errorf("got %q, want %q", got, want)
    }
}