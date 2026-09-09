import type { ActionFunctionArgs } from "react-router";
import { toast } from "react-toastify";

// how to make an edit request - sending data plus specifying ID
export const EditIncidentAction = async ({ request, params }:ActionFunctionArgs) => {
    const payload = await request?.json()
    const { id } = params

    try {
        const response = await fetch(`/api/incident/${id}`, {
            method: 'PATCH',
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