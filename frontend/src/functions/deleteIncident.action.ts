import type { ActionFunctionArgs } from "react-router"
import { toast } from "react-toastify"

export const DeleteIncidentAction = async ({ params }: ActionFunctionArgs) => {
    const { id } = params

    const response = await fetch(`/api/incident/${id}`, {
        method: 'DELETE',
        credentials: "include",
    })
    const data = await response?.json()
    if (!response.ok) {
        toast.error(data.message)
    } else {
        toast.success(data.message)
    }
}