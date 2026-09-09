import { useEffect } from "react"
import { Link, useFetcher, useRouteLoaderData } from "react-router"
import type { GetReportLoaderData } from "../functions/getReport.loader"
import { toast } from "react-toastify"

export const DownloadReport = () => {
    // const data = useRouteLoaderData("report-route") as GetReportLoaderData
    // const error = data.error
    // const report = data.report
    const fetcher = useFetcher<GetReportLoaderData>()

    useEffect(() => {
        if (fetcher.state === 'idle' && !fetcher.data) {
            fetcher.load("/api/report")
        }
    }, [fetcher])

    // const error = fetcher.data?.error
    const report = fetcher.data?.report

    // useEffect(() => {
    //     if (error) toast.error(error)
    // }, [error])

    const prepareExport = ():string => {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        return URL.createObjectURL(blob)
    }

    return (
        <button className="btn btn-sm btn-neutral border-base-content mt-2 w-fit" onClick={() => {
            const url = prepareExport()
            const link = document.createElement('a')
            const time = new Date()
            link.href = url
            link.download = `report-${time.toLocaleDateString()}-${time.toLocaleTimeString()}.json`
            link.click()
            URL.revokeObjectURL(url)
        }}>
            Download report
        </button>
    )
}

export const IncidentReportCenter = () => {
    const data = useRouteLoaderData("get-report") as GetReportLoaderData
    const error = data.error

    useEffect(() => {
        if (error) toast.error(error)
    }, [error])

    if (!data.report) {
        return (    
            <div className='flex flex-col justify-center items-center bg-base-100 rounded-t-md'>
                <span className='text-xl font-bold text-base-content/80 mt-2'>Report is empty</span>
                <span className='text-sm font-bold text-error/80'>At least one incident is required to generate report.</span>
                <div className="mt-4">
                    <Link to="/add" className='btn w-50 h-50'>
                        <div className='flex flex-col justify-center items-center'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <span className='mt-4'>Add first incident</span>
                        </div>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center">
            <span className="flex bg-linear-to-r text-3xl font-bold p-2 from-[#3388ff] to-[#2f64b9] text-transparent bg-clip-text">Report</span>
            <div className="flex flex-col justify-start xl:h-[86vh] lg:h-[84vh] md:h-[80vh] sm:h-[76vh] h-[72vh]">
                <div className="flex flex-col overflow-auto rounded-lg px-0.5 bg-linear-to-b from-transparent via-violet-900 to-transparent">
                    <div className="flex justify-end">
                        <span className="badge badge-neutral bedge-sm font-semibold rounded-none rounded-bl-lg rounded-tr-lg absolute top-15">Preview</span>
                    </div>
                    <pre className="text-xs bg-gray-200 dark:bg-black text-base-content/90 p-4">{JSON.stringify(data.report, null, 2)}</pre>
                </div>
            </div>
            <DownloadReport />
        </div>
    )
}

export const IncidentReportSidebar = () => {
    const fetcher = useFetcher<GetReportLoaderData>()

    useEffect(() => {
        if (fetcher.state === 'idle' && !fetcher.data) {
            fetcher.load("/api/report")
        }
    }, [fetcher])

    const isLoading = fetcher.state === 'loading'
    // const error = fetcher.data?.error
    const report = fetcher.data?.report

    const isAllResolved = !report?.unresolved_names || report?.unresolved_names?.length === 0
    const statClassName = 'stat-value text-xl'

    // useEffect(() => {
    //     if (error) toast.error(error)
    // }, [error])

    const handleMTTR = () => {
        if (!report?.mttr) {
            return (
                <div className={statClassName}>NaN</div>
            )
        }
        return <div className={statClassName}>{report.mttr}</div>
    }

    const handleTotalUnresolved = () => {
        if (isLoading) {
            return <div className="skeleton h-4 w-6"></div>
        }
        if (!isAllResolved) {
            return <div className={statClassName}>{report?.unresolved_names?.length}</div>
        }
        return <div className={statClassName}>NaN</div>
    }

    return (
        <>
            <div className="stat">
                <div className="stat-title">MTTR</div>
                {handleMTTR()}
                <div className="stat-desc">Mean time to recovery (avg)</div>
            </div>
            <div className="stat">
                <div className="stat-title">Total Unresolved</div>    
                {handleTotalUnresolved()}
            </div>
        </>
    )
}