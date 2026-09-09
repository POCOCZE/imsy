import type { ActionFunctionArgs } from "react-router"
import { toast } from "react-toastify"

export const AddIncidentAction = async ({ request }:ActionFunctionArgs ) => {
    try {
        const payload = await request?.json()
        const response = await fetch(`/api/incident`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: "include",
            body: JSON.stringify(payload)
        })
        const data = await response?.json()
        if (!response?.ok) {
            throw new Error(data.message)
        } else {
            if (data.info) toast.info(data.info)
            if (data.message) toast.success(data.message)
        }
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Unknown error')
    }
}

export const AddIncidentsAction = async ({ request }:ActionFunctionArgs ) => {
    try {
        const payload = await request?.json()
        const response = await fetch(`/api/incidents`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: "include",
            body: JSON.stringify(payload)
        })
        const data = await response?.json()
        if (!response?.ok) {
            throw new Error(data.message)
        } else {
            toast.success(data.message)
        }
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Unknown error')
    }
}
