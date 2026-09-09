import type { Incident } from "../components/types";

export interface GetIncidentsLoaderData {
    incidents: Incident[],
    error: string | null,
}

export const GetIncidentsLoader = async (): Promise<GetIncidentsLoaderData> => {
    try {
        const response = await fetch("/api/incidents", {
            method: "GET",
            credentials: "include",
        })
        if (!response.ok) {
            const errorData = await response?.json()
            throw new Error(errorData.message)
        }
        const data: Incident[] = await response.json()
        return { incidents: data, error: null }
    } catch (err) {
        return {
            incidents: [],
            error: err instanceof Error ? err.message : 'Unknown error'
        }
    }
}