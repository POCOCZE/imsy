export interface Incident {
    id: string
    org_id?: string
    name?: string
    title: string
    severity: Severity
    service_name: string
    started_at: string
    resolved_at: string | null
    created_by?: string
    created_at?: string
    updated_at?: string
}

export interface IncidentTableWide extends Incident {
    is_resolved: boolean
    new_message: string
}

export interface AddIncident {
    name: string
    title: string
    severity: string
    service_name: string
    started_at: string | null
    resolved_at: string | null
}

interface IncidentReportDetails {
    name: string
    title: string
    severity?: string
    service_name?: string
}

export interface IncidentReport {
    incidents_count: number
    unresolved_names: string[] | null
    mttr: string
    by_services: Record<string, IncidentReportDetails>
    by_severity: Record<string, IncidentReportDetails>
}

export interface DataColumn{
    kind: 'data'
    key: Extract<keyof Incident, string>
    label: string
    sortable: boolean
    compareFn?: (a: Incident, b: Incident) => number
    render?: (value: any) => React.ReactNode
}

export interface ActionColumn{
    kind: 'action'
    key: string
    label: string
    sortable: false
    render?: (value: any) => React.ReactNode
}

export type Column = DataColumn | ActionColumn
export type Severity = 'critical' | 'high' | 'medium' | 'low'