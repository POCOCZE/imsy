import { useEffect } from "react"
import { useFetcher } from "react-router"
import type { GetHealthzLoaderData } from "../functions/getHealthz.loader"
import { toast } from "react-toastify"

export const HealthStatus = () => {
    const fetcher = useFetcher<GetHealthzLoaderData>()

    useEffect(() => {
        const interval = setInterval(() => {
            if (fetcher.state === 'idle') {
                fetcher.load("/api/healthz")
            }
        }, 10000)

        return () => clearInterval(interval)
    }, [fetcher])

    const error = fetcher.data?.error
    const status = fetcher.data?.status

    useEffect(() => {
        if (error) toast.error(error, {autoClose: false})
    }, [error])

    const healthStatusClass = () => {
        if (error) return 'status-error'
        if (status) return 'status-success'
        return 'status-neutral'
    }

    return (
        <div className="flex items-center justify-center bg-base-200 rounded-lg py-0.5 px-1 shadow border border-base-content/15 w-fit">
            <div aria-label="success" className={`status ${healthStatusClass()} animate-none`}></div>
            <span className="text-xs text-base-content ml-1">API</span>
        </div>
    )
}