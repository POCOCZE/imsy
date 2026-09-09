import { useEffect, useState } from 'react'
import { SortableTable } from './SortableTable'
import { IncidentReportSidebar } from './IncidentReport'
import { Link, useFetcher, useRouteLoaderData, useSearchParams } from 'react-router'
import type { GetIncidentsLoaderData } from '../functions/getIncidents.loader'
import { toast } from 'react-toastify'
import type { Column, Severity } from './types'

export const IncidentList = () => {
    const data = useRouteLoaderData("get-incidents") as GetIncidentsLoaderData
    const error = data?.error
    const incidents = data?.incidents ?? []
    const [currentIncCount, setCurrentIncCount] = useState<number | null>()

    // Search related
    const [searchBg, setSearchBg] = useState<string>('bg-base-100')
    const [searchParams, setSearchParams] = useSearchParams()
    const searchText = searchParams.get("search") || ''
    const activeFilter = searchParams.get("severity") || "all"
    const activeResolved = searchParams.get("resolved") || "all"

    // Tailwind ClassNames
    const sharedBtnClasses = "btn btn-xs border-base-content/15 m-0.5 checked:text-base-content/80 dark:text-base-content/80"
    const filterBtnClasses = `${sharedBtnClasses} btn-neutral checked:text-black dark:checked:text-black`
    const sharedSeverityColorClasses = `${sharedBtnClasses} dark:border-black dark:text-black`

    useEffect(() => {
        if (error) toast.error(error)
    }, [error])

    const severityColor: Record<string, string> = {
        critical: "bg-red-400",
        high: "bg-orange-400",
        medium: "bg-amber-300",
        low: "bg-amber-100",
        all: "bg-success"
    };

    const severityColorChecked: Record<string, string> = {
        critical: "checked:bg-red-400",
        high: "checked:bg-orange-400",
        medium: "checked:bg-amber-300",
        low: "checked:bg-amber-100",
        all: "checked:bg-transparent dark:checked:bg-white/80"
    };

    const severityLabel: Record<string, string> = {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
    }

    const severityOrder: Record<Severity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
    }

    // const severityList = [
    //     {
    //         name: "critical",
    //         order: 0,
    //         label: "Critical",
    //         class: "bg-red-400",
    //         classChecked: "checked:bg-red-400",
    //     },{
    //         name: "high",
    //         order: 1,
    //         label: "High",
    //         class: "bg-orange-400",
    //         classChecked: "checked:bg-orange-400",
    //     },{
    //         name: "medium",
    //         order: 2,
    //         label: "Medium",
    //         class: "bg-amber-300",
    //         classChecked: "checked:bg-amber-300",
    //     },{
    //         name: "low",
    //         order: 3,
    //         label: "Low",
    //         class: "bg-amber-100",
    //         classChecked: "checked:bg-amber-100",
    //     },{
    //         name: "all",
    //         order: 3,
    //         label: "All",
    //         class: "bg-success",
    //         classChecked: "checked:bg-transparent dark:checked:bg-white/80",
    //     }
    // ]

    const columns: Column[] = [
        {
            kind: 'action',
            key: 'is_resolved',
            label: '',
            sortable: false
        },{ 
            kind: 'data',
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (value: string) => <span className='font-semibold'>{value}</span>
        },{
            kind: 'data',
            key: 'title',
            label: 'Title',
            sortable: true
        },{
            kind: 'data',
            key: 'severity',
            label: 'Severity',
            sortable: true,
            compareFn: (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
            render: (value: string) => <div className='flex justify-center items-center'><span className={`${severityColor[value]} ${sharedSeverityColorClasses} px-4`} onClick={() => handleFilterParams(value)}>{severityLabel[value]}</span></div>
        },{
            kind: 'data',
            key: 'service_name',
            label: 'Service name',
            sortable: true
        },{
            kind: 'action',
            key: 'new_message',
            label: '',
            sortable: false
        }
        // { key: 'other', label: '', sortable: ???}
    ]

    const handleSearchText = (value: string) => {
        if (value === '') {
            searchParams.delete("search")
        } else {
            searchParams.set("search", value)
        }
        setSearchParams(searchParams)
    }

    const searchIncidentsField = () => {
        return (
            <label className={`input rounded-lg border-none w-49 ${searchBg}`} onMouseEnter={() => setSearchBg('bg-base-200')} onMouseLeave={() => setSearchBg('bg-base-100')}>
                <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></g></svg>
                <input
                    type="search"
                    placeholder="Search incident names"
                    value={searchText}
                    onChange={(e) => handleSearchText(e.currentTarget.value)}
                />
            </label>
        )
    }

    const handleIncidentCount = () => {
        const statClassName = "stat-value text-xl"
        if (!currentIncCount) {
            return <span className={statClassName}>NaN</span>
        }
        return <span className={statClassName}>{currentIncCount}/{incidents?.length}</span>
    }

    const handleFilterParams = (value: string) => {
        if (value === "all") {
            // remove severity parameter from the url to make it clean
            searchParams.delete("severity")
        } else {
            searchParams.set("severity", value)
        }
        setSearchParams(searchParams)
    }

    const handleResolvedParams = (value: string) => {
        if (value === "all") {
            searchParams.delete("resolved")
        } else {
            searchParams.set("resolved", value)
        }
        setSearchParams(searchParams)
    }

    const severityFilter = () => {
        const sharedBtnPadding = "px-6"
        return (
            <div className='flex flex-col mx-4 my-2 items-center'>
                <span className='text-sm font-semibold m-1'>Severity</span>
                <div className='flex flex-col w-full'>
                    <input
                        className={`${severityColorChecked["all"]} ${filterBtnClasses} ${sharedBtnPadding}`}
                        type="radio"
                        name="frameworks"
                        aria-label="All"
                        value="all"
                        checked={activeFilter === "all"}
                        onChange={(e) => handleFilterParams(e.currentTarget.value)}
                    />
                    <div className='flex justify-center'>
                        <input
                            className={`${severityColorChecked["critical"]} ${filterBtnClasses} ${sharedBtnPadding}`}
                            type="radio"
                            name="frameworks"
                            aria-label="Critical"
                            value='critical'
                            checked={activeFilter === "critical"}
                            onChange={(e) => handleFilterParams(e.currentTarget.value)}
                        />
                        <input
                            className={`${severityColorChecked["high"]} ${filterBtnClasses} ${sharedBtnPadding}`}
                            type="radio"
                            name="frameworks"
                            aria-label="High"
                            value='high'
                            checked={activeFilter === "high"}
                            onChange={(e) => handleFilterParams(e.currentTarget.value)}
                        />
                    </div>
                    <div className='flex justify-center'>
                        <input
                            className={`${severityColorChecked["medium"]} ${filterBtnClasses} ${sharedBtnPadding}`}
                            type="radio"
                            name="frameworks"
                            aria-label="Medium"
                            value='medium'
                            checked={activeFilter === "medium"}
                            onChange={(e) => handleFilterParams(e.currentTarget.value)}
                        />
                        <input
                            className={`${severityColorChecked["low"]} ${filterBtnClasses} ${sharedBtnPadding}`}
                            type="radio"
                            name="frameworks"
                            aria-label="Low"
                            value='low'
                            checked={activeFilter === "low"}
                            onChange={(e) => handleFilterParams(e.currentTarget.value)}
                        />
                    </div>
                </div>
            </div>
        )
    }

    const showIncidentsFilter = () => {
        const sharedBtnPadding = "px-3"
        return (
            <div className='flex flex-col items-center mx-4 my-2'>
                <span className='text-sm font-semibold m-1'>Show incidents</span>
                <div className='flex flex-col w-full'>
                    <input
                        className={`checked:bg-transparent dark:checked:bg-white/80 ${filterBtnClasses} ${sharedBtnPadding}`}
                        type='radio'
                        name='frameworks2'
                        aria-label='All'
                        value='all'
                        checked={activeResolved === "all"}
                        onChange={(e) => handleResolvedParams(e.currentTarget.value)}
                    />
                    <div className='flex'>
                        <input
                            className={`checked:bg-warning ${filterBtnClasses} ${sharedBtnPadding}`}
                            type='radio'
                            name='frameworks2'
                            aria-label='Unresolved'
                            value='unresolved'
                            checked={activeResolved === "unresolved"}
                            onChange={(e) => handleResolvedParams(e.currentTarget.value)}
                        />
                        <input
                            className={`checked:bg-success ${filterBtnClasses} ${sharedBtnPadding}`}
                            type='radio'
                            name='frameworks2'
                            aria-label='Resolved'
                            value='resolved'
                            checked={activeResolved === "resolved"}
                            onChange={(e) => handleResolvedParams(e.currentTarget.value)}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='flex flex-col items-center overflow-y-auto'>
            <span className='flex text-3xl font-bold justify-center bg-linear-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mt-2 mb-1'>Incident list</span>
            <div className='flex'>
                {/* Center */}
                <div>
                    <div className='rounded-lg h-fit shadow-md bg-base-200 border border-base-content/15 overflow-x-auto m-1 xl:max-w-full lg:max-w-[70vw] md:max-w-[60vw] sm:max-w-[52vw] max-w-[45vw]'>
                        <SortableTable
                        columns={columns}
                        data={incidents}
                        setCurrentIncCount={setCurrentIncCount}
                        />
                    </div>
                    {incidents.length === 0 &&
                        <div className='flex flex-col justify-center items-center bg-base-100 rounded-t-md mt-4'>
                            <div>
                                <Link to="/add" className='btn w-50 h-50'>
                                    <div className='flex flex-col justify-center items-center'>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-20">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        <span className='mt-4'>Add first incident</span>
                                    </div>
                                </Link>
                            </div>  
                        </div>}
                </div>
                {/* Sidebar */}
                <div className='flex flex-col m-1'>
                    {/* Stats */}
                    <div className="flex flex-col stats stats-vertical bg-base-200 shadow-sm/10 border border-base-content/15 w-fit">
                        <div className="stat">
                            <div className="stat-title">Incident Count</div>
                            {handleIncidentCount()}
                            <div className="stat-desc">Current count out of all</div>
                        </div>
                        <IncidentReportSidebar />
                    </div>
                    {/* Filters */}
                    <div className='flex flex-col rounded-lg mt-2 bg-base-200 shadow-sm/10 border border-base-content/15'>
                        <span className='text-xl font-bold text-center pb-1 border-b border-base-content/15 mt-2'>Filters</span>
                        <div className='flex justify-center pt-1 pb-1 border-b border-base-content/15 bg-base-100'>
                            {searchIncidentsField()}
                        </div>
                        {severityFilter()}
                        <span className='pb-1 border-b border-base-content/15'></span>
                        {showIncidentsFilter()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export const ExportIncidents = () => {
    // Fetcher logic where data is gathered only when clicks a button.
    const fetcher = useFetcher<GetIncidentsLoaderData>()
    const isLoading = fetcher.state === 'loading'
    
    const handleDownloadClick = () => {
        fetcher.load("/api/incidents")
    }

    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data?.incidents) {
            downloadAsJson(fetcher.data.incidents, "incidents")
        }
    }, [fetcher.state, fetcher.data])

    return (
        <button
            className="btn btn-sm btn-neutral border-base-content mt-2 w-fit"
            disabled={isLoading}
            onClick={handleDownloadClick}>
            {isLoading ? 'Loading ...' : 'Export incidents'}
        </button>
    )
}

export const downloadAsJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" } )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const time = new Date()
    a.href = url
    a.download = `${filename}-${time.toLocaleDateString()}-${time.toLocaleTimeString()}.json`
    a.click()
    URL.revokeObjectURL(url)
}