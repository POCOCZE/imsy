import { useEffect, useState, type SetStateAction } from 'react'
import { IncidentEditModal, OneButtonModal } from './Modal'
import { useFetcher, useRevalidator, useSearchParams, type FetcherWithComponents } from 'react-router'
import type { Column, Incident } from './types'

interface SortableTableProps {
    columns: readonly Column[]
    data: Incident[]
    setCurrentIncCount: React.Dispatch<SetStateAction<number | null | undefined>>
}

export const SortableTable = ({columns, data = [], setCurrentIncCount}: SortableTableProps) => {
    const fetcher = useFetcher()
    const [currentHoveredRowID, setcurrentHoveredRowID] = useState<string | undefined>(undefined)

    const [searchParams, setSearchParams] = useSearchParams()

    const severityFilter = searchParams.get("severity") || "all"
    const resolvedFilter = searchParams.get("resolved") || "all"
    const searchText = searchParams.get("search") || ''
    const rawSortingKey = searchParams.get("sortkey") || 'name'
    // type SortKey = typeof columns[number]['key']
    const sortingDir = searchParams.get("sortdir") || 'asc'

    const revalidator = useRevalidator()

    const matchedColumn = columns.find(c => c.sortable === true && c.key === rawSortingKey)
    const sortingKey = matchedColumn?.key ?? columns[0].key

    // const handleDelete = async (incidentID: string) => {
    //     const response = await fetch(`/api/incident/${incidentID}`, {
    //         method: 'DELETE',
    //         credentials: "include",
    //     })
    //     const data = await response?.json()
    //     if (!response.ok) {
    //         toast.error(data.message)
    //     } else {
    //         toast.success(data.message)
    //     }
    //     // React-Router will not re-run the loader
    //     revalidator.revalidate()
    // }

    const handleSortingKey = (value: string) => {
        if (value === 'name') {
            searchParams.delete("sortkey")
        } else {
            searchParams.set("sortkey", value)
        }
        setSearchParams(searchParams)
    }

    const handleSortingDir = (value: string) => {
        if (value === 'asc') {
            searchParams.delete("sortdir")
        } else {
            searchParams.set("sortdir", value)
        }
        setSearchParams(searchParams)
    }

    // I. Filter by search field
    const filterSearchKeyword = () => {
        if (searchText === '') {
            return data
        } else {
            return data.filter(item => item.name?.toLowerCase().includes(searchText?.toLowerCase()))
        }
    }

    // II. (then) Filter by resolved
    const filterResolved = () => {
        if (resolvedFilter === 'unresolved') {
            return filterSearchKeyword().filter(item => item.resolved_at === null)
        }
        if (resolvedFilter === 'resolved') {
            return filterSearchKeyword().filter(item => item.resolved_at !== null)
        }
        return filterSearchKeyword()
    }

    // III. (then) Filter by severity
    // Final array of filtered incidents
    const filteredIncidents = () => {
        if ( severityFilter === 'all') {
            return filterResolved()
        } else {
            return filterResolved().filter(item => item.severity === severityFilter)
        }
    }

    // Only recalculate Incident count when the values in the square brackets change. This is the correct pattern.
    useEffect(() => {
        setCurrentIncCount(filteredIncidents()?.length)
    }, [severityFilter, resolvedFilter, searchText, data])

    const handleSort = async (colKey: string) => {
        // Do not sort "message" and "other" columns
        if (colKey === 'new_message' || colKey === 'other') {
            return
        }
        if (colKey === sortingKey) {
            handleSortingDir(sortingDir === 'asc' ? 'desc' : 'asc')
        } else {
            handleSortingKey(colKey)
            handleSortingDir('asc')
        }
    }

    // Todo: when incident count goes from X to zero - the UI cannot render empty table like that - thus crash...need to resolve it
    const sortedData = [...filteredIncidents()].sort((a, b) => {
        if (matchedColumn && 'compareFn' in matchedColumn && matchedColumn.compareFn) {
            const result = matchedColumn.compareFn(a, b)
            return sortingDir === 'asc' ? result : -result
        }

        const valA = (a as any)[sortingKey] 
        const valB = (a as any)[sortingKey] 
        if (valA < valB) return sortingDir === 'asc' ? -1 : 1
        if (valA > valB) return sortingDir === 'asc' ? 1 : -1
        return 0
    })

    const renderDeleteButton = (incidentID: string, incidentName: string) => {
        return (
            <OneButtonModal buttonText={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
            } title={
                <>
                    <span>Are you sure you want to delete </span>
                    <span className='bg-linear-to-r from-violet-600 to-blue-500 text-transparent bg-clip-text'>{incidentName}</span>
                    <span> ?</span>
                </>
            } description={
                <>
                    This action is irreversible.
                    <br/>
                    Incident will be removed forever after its deleted!
                </>
            } closeButtonText={
                    <button className='btn btn-sm btn-error fixed bottom-4 right-4' onClick={() => {
                        HandleIncidentDelete(fetcher, incidentID)
                        revalidator.revalidate()
                        // handleDelete(incidentID)
                    }}>Delete</button>
            } />
        )
    }

    const subtractDates = (date1: string, date2: string): number => {
        const time1 = new Date(date1).getTime()
        const time2 = new Date(date2).getTime()
        let timeDiff: number
        if (time1 > time2) {
            timeDiff = time1 - time2
        } else {
            timeDiff = time2 - time1
        }
        return Math.round(timeDiff / 1000)
    }

    const secondsToTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        seconds %= 3600
        const minutes = Math.floor(seconds / 60)
        if (hours === 0) {
            return `${minutes}m`
        } else {
            return `${hours}h${minutes}m`
        }
    }

    const setupMessage = (row: any) => {
        if (row.resolved_at === null) {
            const browserTime = UTCToBrowserTime(row.started_at)
            return (
                <div className='flex flex-col justify-center items-end h-8'>
                    <span>Pending ...</span>
                    <div className='flex'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
                        </svg>
                        <span className='text-xs text-base-content/70'>{browserTime}</span>
                    </div>
                </div>
            )
        }

        const timeDiff = subtractDates(row.started_at, row.resolved_at)
        const time = secondsToTime(timeDiff)
        const browserTime = UTCToBrowserTime(row.resolved_at)
        return (
            <div className='flex flex-col justify-center items-end h-8'>
                <span>Resolved in {time}</span>
                <div className='flex'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                    </svg>
                    <span className='text-xs text-base-content/70'>{browserTime}</span>
                </div>
            </div>
        )
    }

    const renderTableButtons = (row: any) => {
        if (row.id === currentHoveredRowID) {
            return (
                <div className='flex justify-end items-center h-8'>
                    <IncidentEditModal editIcon={
                        <span className='fill-base-content'>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                            <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                            </svg>
                        </span>
                    } incidentID={row.id} />
                    {renderDeleteButton(row.id, row.name)}
                </div>
            )
        }
        return setupMessage(row)
    }

    const renderIsResolved = (resolved_at: any) => {
        if (resolved_at === null) {
            return '✗'
        }
        return '✓'
    }

    return (
        <table className='table table-md table-pin-rows min-w-200'>
            <thead>
                <tr>
                { columns.map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)} className={`cursor-pointer select-none ${col.key === 'new_message' && 'min-w-42'} ${col.key === 'severity' && 'text-center'}`}>
                        {col.label}
                        {sortingKey === col.key && (sortingDir === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody>
                {sortedData.map((row, index) => (
                <tr
                    className={`${row.id === currentHoveredRowID && 'bg-base-300/50'}`}
                    key={row.id || index}
                >
                    {columns.map(col => (
                        <td
                            key={col.key}
                            onMouseEnter={() => setcurrentHoveredRowID(row.id)}
                            onMouseOver={() => setcurrentHoveredRowID(row.id)}
                        >
                            {col.render ? col.render((row as any)[col.key]) : (row as any)[col.key]}
                            {col.key === 'resolved_at' && row[col.key] === null && 'Unresolved'}
                            {col.key === 'new_message' && renderTableButtons(row)}
                            {col.key === 'is_resolved' && <span className='select-none'>{renderIsResolved(row.resolved_at)}</span>}
                        </td>
                    ))}
                </tr>
                ))}
            </tbody>
        </table>
    )
}

export const HandleIncidentDelete = (fetcher: FetcherWithComponents<any>, id: string) => {
    fetcher.submit(null,
        {
            method: "DELETE",
            action: `/api/incident/delete/${id}`,
            encType: "application/json"
        }
    )
}

export const UTCToBrowserTime = (time: string):string => {
    const d = new Date(time).toLocaleString('default', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit'
    })
    return d
}