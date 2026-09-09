import { useState } from "react";
import { useFetcher, type FetcherWithComponents } from "react-router";
import { toast } from "react-toastify";
import type { AddIncident } from "./types";

// ? Maybe switch const to interface in the future to make it cleaner
// interface Incident {
//     id: string
//     title: string
//     severity: string
//     service_name: string
//     started_at: string
//     resolved_at: string | undefined
// }

export const IncidentAdd = () => {
    const fetcher = useFetcher()

    // ID, OrgID and CreatedBy (UUIDv7) will be set by backend
    const [name, setName] = useState<string>('')
    const [title, setTitle] = useState<string>('')
    const [severity, setSeverity] = useState<string>('critical')
    const [serviceName, setServiceName] = useState<string>('')
    const [startedAt, setStartedAt] = useState<string>('')
    const [resolvedAt, setResolvedAt] = useState<string>('')

    const [incidentsFile, setIncidentsFile] = useState<File | null>(null)

    const calcTimeZoneOffset = async ():Promise<string> => {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZoneName: 'longOffset'
        })
        const formatted = formatter.format(new Date())
        const offset = formatted.split('GMT')[1] // 
        const result = ':00' + offset
        return result
    }

    const postIncident = async () => {
        try {
            // Correct time with timezone; applies for startedAt and also for resolvedAt (if defined)
            const result = await calcTimeZoneOffset()
            const resolved_at = resolvedAt !== '' ? resolvedAt + result : null

            // allow empty started_at, backend will set current time
            let started_at: string | null
            if (startedAt === "") {
                started_at = null
            } else {
                started_at = await StringToUTC(startedAt + result)
            }

            // If user did not imported list of incidents, add one incident
            if (incidentsFile === null) {
                HandleAdd(fetcher,
                    {
                        name: name,
                        title: title,
                        severity: severity,
                        service_name: serviceName,
                        started_at: started_at,
                        resolved_at: resolved_at
                    }
                )
            } else {
                const contents = await incidentsFile.text()
                HandleAddList(fetcher, contents)
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const minWidthFields = 'flex flex-col'
    const inputWidthFields = 'mb-4 lg:min-w-[50vw] md:min-w-[50vw] sm:min-w-[50vw] min-w-[70vw]'

    return (
        <>
            <span className="flex text-3xl font-bold justify-center mt-4 bg-linear-to-r from-amber-600 to-yellow-400 text-transparent bg-clip-text">Add Incident</span>
            <fieldset className="fieldset">
                {/* <legend className="fieldset-legend">Page details</legend> */}
                <div className="flex flex-col items-center">
                    <div className={minWidthFields}>
                        <label className="label">Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} type="text" className={`input ${inputWidthFields}`} placeholder="INC-001" />
                    </div>
                    <div className={minWidthFields}>
                        <label className="label">Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" className={`input ${inputWidthFields}`} placeholder="PostgreSQL corruption" />
                    </div>
                    <div className={minWidthFields}>
                        <label className="label">Severity</label>
                        <label className={`select ${inputWidthFields}`}>
                            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                                <option value='critical'>Critical</option>
                                <option value='high'>High</option>
                                <option value='medium'>Medium</option>
                                <option value='low'>Low</option>
                            </select>
                        </label>
                    </div>
                    <div className={minWidthFields}>
                        <label className="label">Service Name</label>
                        <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} type="text" className={`input ${inputWidthFields}`} placeholder="postgresql-replica-1" />
                    </div>
                    <div className={minWidthFields}>
                        <label className="label">Started at</label>
                        <label className={`input ${inputWidthFields}`}>
                            <input value={startedAt} onChange={(e) => setStartedAt(e.target.value)} type="datetime-local" />
                            <span className="badge badge-soft badge-xs ml-0.5">Optional</span>
                        </label>
                    </div>
                    <div className={minWidthFields}>
                        <label className="flex items-center label">Resolved at</label>
                        <label className={`input ${inputWidthFields}`}>
                            <input value={resolvedAt} onChange={(e) => setResolvedAt(e.target.value)} type="datetime-local" />
                            <span className="badge badge-soft badge-xs ml-0.5">Optional</span>
                        </label>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    {/* Todo: Set maximum file size for the file */} 
                    <span className="text-gray-600">Import multiple incidents from file:</span>
                    <input type="file" placeholder="You can't touch this" className="file-input" onChange={(e) => {
                        const file = e.currentTarget.files?.[0] ?? null
                        setIncidentsFile(file)
                    }} />
                    <button onClick={() => {
                        postIncident()
                    }} className="btn btn-sm btn-neutral checked:text-black dark:checked:text-white border-base-content mt-6 m-0.5 px-5.5">Submit</button>
                </div>
            </fieldset>
        </>
    )
}

const HandleAdd = (fetcher: FetcherWithComponents<any>, {name, title, severity, service_name, started_at, resolved_at}:AddIncident) => {
    fetcher.submit(
        {
            name: name,
            title: title,
            severity: severity,
            service_name: service_name,
            started_at: started_at,
            resolved_at: resolved_at
        },{
            method: "POST",
            action: "/api/incident/add",
            encType: "application/json"
        }
    )
}

const HandleAddList = (fetcher: FetcherWithComponents<any>, file: string) => {
    fetcher.submit(file,
        {
            method: "POST",
            action: "/api/incidents/add",
            encType: "application/json"
        }
    )
}

export const CurrentBrowserTimeToUTC = async ():Promise<string> => {
    const userDate = new Date()
    return userDate.toISOString()
}

export const StringToUTC = async (value: string): Promise<string> => {
    if (value) {
        const valueDate = new Date(value)
        return valueDate.toISOString()
    }
    return ""
}