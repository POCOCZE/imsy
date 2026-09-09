import { DownloadReport } from './IncidentReport'
import { ExportIncidents } from './IncidentList'
import type { GetReportLoaderData } from '../functions/getReport.loader'
import { Link, useFetcher } from 'react-router'
import { useEffect } from 'react'

export const HomePage = () => {
    return (
        <>
            <span className='text-center text-4xl mt-4 font-bold bg-linear-to-r from-blue-500 to-cyan-400 text-transparent bg-clip-text'>Incident Analyzer</span>
            <div className='flex flex-col ml-20 m-2'>
                <div className='flex flex-col mt-4'>
                    <div role="alert" className="alert alert-soft w-fit mb-1 bg-linear-to-r from-emerald-300 to-green-400 dark:from-emerald-800 dark:to-green-900">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info h-6 w-6 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className='text-lg'>Quickly add, edit or remove incidents. Download report or see all incidents in a sortable table with filters.</span>
                    </div>
                    <span className='font-light'>Quick help: Navigate through various features on the left side.</span>
                </div>
                <div className='flex flex-col mt-12'>
                    <span className='text-xl font-bold'>Quick actions</span>
                    <div className='flex flex-col mt-2 w-fit items-center'>
                        <DownloadReport />
                        <ExportIncidents />
                        <IncidentsUnresolved />
                    </div>
                </div>
            </div>
        </>
    )
}

const IncidentsUnresolved = () => {
    // const data = useRouteLoaderData("report-route") as GetReportLoaderData
    const fetcher = useFetcher<GetReportLoaderData>()
    // const error = fetcher.data?.error
    const report = fetcher.data?.report

    useEffect(() => {
        // if (error) toast.error(error)
        if (fetcher.state === 'idle' && !fetcher.data) {
            fetcher.load("/api/report")
        }
    }, [fetcher])

    if (!report?.unresolved_names) return null

    return (
        <div className="flex flex-col shadow p-2 mt-2 bg-base-300 rounded-lg h-fit border border-base-content/15">
            <div className="flex flex-col items-center m-2">
                <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="red" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <span className="text font-semibold ml-1">Unresolved</span>
                </div>
            <span className="text-xl text-red-500 font-bold">{report?.unresolved_names?.length}</span>
            <Link to='/browse?resolved=unresolved' className="btn btn-sm btn-neutral border-base-content mt-2 w-fit">More</Link>
            </div>
        </div>
    )   
}