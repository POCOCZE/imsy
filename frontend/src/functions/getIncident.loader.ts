import { toast } from "react-toastify"
import type { Incident } from "../components/types"
import type { LoaderFunctionArgs } from "react-router"

export interface GetIncidentLoaderData {
    incident: Incident | null
    error: string | null
}

export const GetIncidentLoader = async ({ params }:LoaderFunctionArgs): Promise<GetIncidentLoaderData> => {
    const { id } = params

    try {
        const response = await fetch(`/api/incident/${id}`, {
            method: "GET",
            credentials: "include",
            })
            if (!response?.ok) {
                const errorData = await response?.json()
                // console.log('Error response', errorData)
                throw new Error(errorData.message)
            }
        const incident: Incident = await response?.json()

        // setID(data.id)
        // setOrgID(data.org_id)
        // setName(data.name)
        // setTitle(data.title)
        // setSeverity(data.severity)
        // setServiceName(data.service_name)
        // setStartedAt(data.started_at)
        // setCreatedBy(data.created_by)
        // setCreatedAt(data.created_at)
        // if (data.resolved_at === null) {
        //     setResolvedAt('')
        //     setIsResolved(false)
        // } else {
        //     setResolvedAt(data.resolved_at)
        //     setOriginalResolvedAt(data.resolved_at)
        // }

        return { incident: incident, error: null}
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Unknown error')
        return {
            incident: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        }
    }
}