package core

import (
	"fmt"
	"time"
)

// Assign an incident to a map. Keys are nested - first is ServiceName, then incident ID. Value is IncidentReportDetails struct.
func (r *IncidentReport) groupIncidentsByService(incident *Incident) {
    r.ByServices[incident.ServiceName] = append(r.ByServices[incident.ServiceName], IncidentReportDetails{
        Name: incident.Name,
        Title: incident.Title,
        Service: incident.ServiceName,
    })
}

// Assign an incident to a map. Keys are nested - first is Severity, then incident ID. Value is IncidentReportDetails struct.
func (r *IncidentReport) groupIncidentsBySeverity(incident *Incident) {
    r.BySeverity[incident.Severity] = append(r.BySeverity[incident.Severity],
    IncidentReportDetails{
        Name: incident.Name,
        Title: incident.Title,
        Service: incident.ServiceName,
    })
}

// Calculate MTTR (mean time to recovery)
// First is all incident durations summed, and averaged across only resolved incidents. 
// Unresolved are not kept in mind because their duration is effectively zero and thus would avoid the calculations.
func (r *IncidentReport) CalcMTTRSec(durations map[string]IncidentDuration) error {
    // Sum all values in 'durations' map. Each key in the map represent duration (how much time was required to solve the particular incident) of each incident. Unresolved incidents have 0 seconds.
    var sum float64
    for _, incDuration := range durations {
        sum += incDuration.Seconds
    }

    // Calculate average MTTR across all resolved incidents.
    if len(durations) == 0 {
        return fmt.Errorf("you don't have any incidents yet")
    }
    resolvedIncidentCount := r.IncidentsCount - len(r.UnresolvedNames)
    avgSeconds := int(sum / float64(resolvedIncidentCount))

    hms := time.Duration(avgSeconds) * time.Second
    r.MTTR = hms.String()

    return nil
}

// Calculate incident duration for all incidents. Unresolved incidents will have 0 seconds duration automatically.
func CalcIncidentDuration(durations map[string]IncidentDuration, incident *Incident) {
    var durationSec float64
    
    // Calculate time difference only for resolved incidents.
    if incident.ResolvedAt != nil {
        startedAt := incident.StartedAt
        resolvedAt := incident.ResolvedAt
        durationSec = resolvedAt.Sub(*startedAt).Seconds()
    }

    hms := time.Duration(durationSec) * time.Second
    durations[incident.Name] = IncidentDuration{
        Seconds: durationSec,
        HMSFormat: hms.String(),
    }
}

// This is constructor function: inizialize structure for IncidentReport
func NewIncidentReport() *IncidentReport {
    return &IncidentReport{
        ByServices: make(map[string][]IncidentReportDetails),
        BySeverity: make(map[string][]IncidentReportDetails),
    }
}

// Group and calculate length of incidents. Returns an IncidentReport struct.
func BuildReport(incidents *[]Incident) (*IncidentReport, error) {
    // Initialize maps before they can be used
    report := NewIncidentReport()
    report.IncidentsCount = len(*incidents)

    durations := make(map[string]IncidentDuration)
    for _, incident := range *incidents {
        // Add unresolved incidents to Slice
        if incident.ResolvedAt == nil {
            report.UnresolvedNames = append(report.UnresolvedNames, incident.Name)
        }

        // Calculate incident duration and group incidents
        CalcIncidentDuration(durations, &incident)
        report.groupIncidentsByService(&incident)
        report.groupIncidentsBySeverity(&incident)
        // report.groupIncidentsByID(incident)
    }

    // Calculate MTTR, average across all incidents
    err := report.CalcMTTRSec(durations)
    if err != nil {
        return nil, err
    }
    return report, nil
}