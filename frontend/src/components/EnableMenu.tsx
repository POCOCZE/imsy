import { useEffect, useState } from "react"
import { Link, useFetcher, useMatch, useResolvedPath } from "react-router"
import type { GetReportLoaderData } from "../functions/getReport.loader"
import { toast } from "react-toastify"

interface MenuItemProps {
    to: string
    tooltip: string
    icon: (className: string) => React.ReactNode
}

const MenuItem = ({to, tooltip, icon}: MenuItemProps) => {
    // Resolved the path and check if the matches the current url
    const resolved = useResolvedPath(to)
    const match = useMatch({path: resolved.pathname, end: true})
    const isActive = !!match

    // Defined classes based on isActive state
    const liClass = isActive ? 'menu-active rounded-xl' : ''
    const iconClass = isActive ? 'size-6 dark:fill-base-content fill-white' : 'size-6 fill-base-content/30'

    return (
        <li className={liClass}>
            <Link to={to} className="tooltip tooltip-right" data-tip={tooltip}>
                {icon(iconClass)}
            </Link>
        </li>
    )
}

export const EnableMenu = () => {
    return(
        <ul className="menu rounded-box">
            <MenuItem
                to="/"
                tooltip="Home"
                icon={(className) => (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
                    <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                    <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                    </svg>
                )}>
            </MenuItem>
            <MenuItem
                to="/add"
                tooltip="Add"
                icon={(className) => (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
                    </svg>
                )}>
            </MenuItem>
            <MenuItem
                to="/browse"
                tooltip="Incidents"
                icon={(className) => (
                    <div className="indicator">
                        <PrintUnresolved />
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
                        <path d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" />
                        </svg>
                    </div>
                )}>
            </MenuItem>
            <MenuItem
                to="/report"
                tooltip="Report"
                icon={(className) => (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
                    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                    </svg>
                )}>
            </MenuItem>
        </ul>
    )
}

const PrintUnresolved = () => {
    // const data = useRouteLoaderData("report-route") as GetReportLoaderData
    const [haveUnresolved, setHaveUnresolved] = useState<boolean>(false)

    const fetcher = useFetcher<GetReportLoaderData>()
    const error = fetcher.data?.error
    const report = fetcher.data?.report

    useEffect(() => {
        if (fetcher.state === 'idle' && !fetcher.data) {
            fetcher.load("/api/report")
        }
        if (error) {
            toast(() => (
            <div className="flex flex-col">
                <span>{error}</span>
                <div className="flex justify-center mt-2">
                    <Link className="btn border-base-content/15 w-fit" to="/add" onClick={() => toast.dismiss()}>
                    Add first one
                    </Link>
                </div>
            </div>
            ), { autoClose: 10000 });
        }
    }, [error, fetcher])

    useEffect(() => {
        if (!report?.unresolved_names) {
            setHaveUnresolved(false)
        } else {
            setHaveUnresolved(true)
        }
    }, [report])

    if (haveUnresolved && report?.unresolved_names) {
        return (
            <span className="indicator-item badge badge-error badge-xs absolute text-xs text-base-content px-1 font-semibold top-0.5 right-0.5">{report?.unresolved_names?.length > 99 ? '99+' : report.unresolved_names.length}</span>
        )
    }
    return null
}