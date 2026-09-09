import type { IncidentReport } from "../components/types";

export interface GetReportLoaderData {
    report: IncidentReport | null
    error: string | null
}

export const GetReportLoader = async (): Promise<GetReportLoaderData> => {
    try {
        const response = await fetch("/api/report", {
            method: "GET",
            credentials: "include",
        })
        if (!response.ok) {
            const errorData = await response?.json()
            throw new Error(errorData.message)
        }
        const data = await response.json()
        return { report: data, error: null }
    } catch (err) {
        return {
            report: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        }
    }
}