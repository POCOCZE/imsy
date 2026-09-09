import { useState, useRef } from 'react'
import { UTCToBrowserTime } from './SortableTable'
import { useFetcher, type FetcherWithComponents } from 'react-router'
import type { GetIncidentLoaderData } from '../functions/getIncident.loader'
import type { Incident } from './types'
import { StringToUTC } from './IncidentAdd'

interface ModalProps {
    buttonText: React.ReactNode
    buttonClassName?: string
    title: React.ReactNode
    description: React.ReactNode
    closeButtonText: React.ReactNode
}

interface IncidentEditProps {
    editIcon: React.ReactNode
    incidentID: string
}

export const OneButtonModal = ({buttonText, buttonClassName, title, description, closeButtonText}: ModalProps) => {
    const modalRef = useRef<HTMLDialogElement>(null)

    let btnClassName: string

    if (buttonClassName) {
       btnClassName = buttonClassName 
    } else {
        btnClassName = "btn btn-xs hover:btn-error btn-ghost mx-1"
    }

    return (
        <>
        {/* Open modal */}
        <button className={btnClassName} onClick={() => modalRef.current?.showModal()}>{buttonText}</button>
        <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
            <div className="modal-box">
                <span className="font-bold text-xl">{title}</span>
                <p className="pt-3">{description}</p>
                <div className="modal-action">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                        <span>{closeButtonText}</span>
                    </form>
                </div>
            </div>
        </dialog>
        </>
    )
}

export const IncidentEditModal = ({editIcon, incidentID}: IncidentEditProps) => {
    const incEditFetcher = useFetcher()

    const modalRef = useRef<HTMLDialogElement>(null)
    const fetcher = useFetcher<GetIncidentLoaderData>()
    const incident = fetcher.data?.incident

    // error is handled by the loader, prints error toast, but for checks lets have it right here
    // const error = fetcher.data?.error

    const fetchIncidentByID = () => {
        fetcher.load(`/api/incident/${incidentID}`)
    }

    const [title, setTitle] = useState<string>('')
    const [severity, setSeverity] = useState<string>('')
    const [serviceName, setServiceName] = useState<string>('')
    const [resolvedAt, setResolvedAt] = useState<string | undefined>(undefined)

    const [submitBtnBg, setSubmitBtnBg] = useState<string>('btn-neutral')

    const [enableResolvedAtOption, setEnableResolvedAtOption] = useState<boolean>(false)

    // useEffect(() => {
    //     // setTitle(incident?.title)
    //     if (incident?.severity) setSeverity(incident?.severity)
    //     // setServiceName(incident?.service_name)
    //     // if (incident?.resolved_at) setResolvedAt(incident?.resolved_at)
    // }, [])

    // // Todo: switch to fetcher and useFetcher
    // const fetchIncidentByID = async () => {
    //     try {
    //         const response = await fetch(`/api/incident/${incidentID}`, {
    //             method: "GET",
    //             credentials: "include",
    //         })
    //         if (!response?.ok) {
    //             const errorData = await response?.json()
    //             console.log('Error response', errorData)
    //             throw new Error(`- ${errorData.error}`)
    //         }
    //         const data: Incident = await response.json()

    //         setID(data.id)
    //         setOrgID(data.org_id)
    //         setName(data.name)
    //         setTitle(data.title)
    //         setSeverity(data.severity)
    //         setServiceName(data.service_name)
    //         setStartedAt(data.started_at)
    //         setCreatedBy(data.created_by)
    //         setCreatedAt(data.created_at)
    //         if (data.resolved_at === null) {
    //             setResolvedAt('')
    //             setIsResolved(false)
    //         } else {
    //             setResolvedAt(data.resolved_at)
    //             setOriginalResolvedAt(data.resolved_at)
    //         }
    //     } catch (err) {
    //         toast.error(err instanceof Error ? err.message : 'Unknown error')
    //     }
    // }

    // const RenderLoading = () => {
    //     if (loading) {
    //         return (
    //             <div className="flex w-4 justify-center items-center flex-col gap-4">
    //                 <div className="skeleton h-4 w-full"></div>
    //             </div>
    //         )   
    //     }
    // }

    // const timeStringToUTC = async (time: string | undefined):Promise<string> => {
    //     try {
    //         if (time === undefined) {
    //             throw new Error("time variable is undefined.")
    //         }
    //         const userDate = new Date(time)
    //         return userDate.toISOString()
    //     } catch (err) {
    //         toast.error(err instanceof Error ? err.message : 'Unknown error occured')
    //         return ''
    //     }
    // }

    const patchIncidentBody: Partial<Incident> = {}

    const patchIncident = async () => {
        if (title === "") {
            patchIncidentBody.title = incident?.title
        } else {
            patchIncidentBody.title = title
        }

        if (severity === undefined) {
            patchIncidentBody.severity = incident?.severity
        } else {
            patchIncidentBody.severity = undefined
        }

        if (serviceName === "") {
            patchIncidentBody.service_name = incident?.service_name
        } else {
            patchIncidentBody.service_name = serviceName
        }

        if (incident?.started_at) {
            patchIncidentBody.started_at = await StringToUTC(incident?.started_at)
        }

        if (resolvedAt) {
            patchIncidentBody.resolved_at = await StringToUTC(resolvedAt)
        } else {
            patchIncidentBody.resolved_at = null
        }

        HandleEdit(incEditFetcher, patchIncidentBody, incidentID)

        // try {
        //     const response = await fetch(`/api/incident/${incidentID}`, {
        //         method: 'PATCH',
        //         headers: {'Content-Type': 'application/json'},
        //         credentials: "include",
        //         body: JSON.stringify(patchIncidentBody)
        //         // body: JSON.stringify({
        //         //     name: incident?.name,
        //         //     title: title,
        //         //     severity: severity,
        //         //     service_name: serviceName,
        //         //     started_at: incident?.started_at,
        //         //     resolved_at: await timeStringToUTC(resolvedAt)
        //         // })
        //     })
        //     const data = await response?.json()
        //     if (!response?.ok) {
        //         throw new Error(data.message)
        //     } else {
        //         toast.success(data.message)
        //     }
        // } catch (err) {
        //     toast.error(err instanceof Error ? err.message : 'Unknown error')
        // }
    }

    const RenderResolvedAtField = () => {
        // When incident is already marked as resolved - the render button that enable this field. Not resolved incidents will get field straight.
        const ResolvedAtField = () => {
            return (
                <>
                <label className="flex items-center label">Resolved at<span className="badge badge-soft badge-xs bg-base-300 ml-0.5">Optional</span></label>
                <label className="input mb-4 lg:min-w-[20vw]">
                    <input value={resolvedAt} onChange={(e) => {
                        setResolvedAt(e.target.value)
                    }} type="datetime-local" />
                </label>
                </>
            )
        }

        if (incident?.resolved_at) {
            return (
                <>
                <div className='flex justify-between items-center'>
                    <div className='flex flex-col'>
                        <span className='label'>Change resolved date</span>
                    </div>
                    <div className='mr-1'>
                        <input type='checkbox' className='toggle' onChange={() => setEnableResolvedAtOption(!enableResolvedAtOption)} checked={enableResolvedAtOption}></input>
                    </div>
                </div>
                <div className='mt-2'>
                    {enableResolvedAtOption && <ResolvedAtField />}
                </div>
                </>
            )
        } else {
            return <ResolvedAtField />
        }
    }

    return (
        <>
        <button className='btn btn-xs btn-ghost hover:bg-base-100 hover:border-base-content active:btn-warning' onClick={() => {
            modalRef.current?.showModal()
            fetchIncidentByID()
        }}>{editIcon}</button>
        <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
            <div className="modal-box w-fit bg-base-300">
                <div className='flex flex-col m-1 justify-center items-start'>
                    <div>
                        <span className='text-xl font-semibold pr-1'>Editing incident</span>
                        <span className='text-xl font-bold bg-linear-to-r from-violet-600 to-blue-500 text-transparent bg-clip-text px-0.5'>{incident?.name}</span>
                    </div>
                    <div className='flex items-center'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
                        </svg>
                        { incident?.started_at &&
                            <span className='label px-0.5'>Started {UTCToBrowserTime(incident?.started_at)}</span>
                        }
                    </div>
                        {incident?.resolved_at &&
                            <div className='flex items-center'>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                                </svg>
                                    <span className='label px-0.5'>Ended {UTCToBrowserTime(incident.resolved_at)}</span>
                            </div>
                        }
                </div>
                <fieldset className="fieldset rounded-box shadow p-4 bg-base-200">
                    <div className="flex flex-col">
                        <label className="label">Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" className="input mb-4 lg:min-w-[20vw]" placeholder={incident?.title} />

                        <label className="label">Severity</label>
                        <label className="select mb-4 lg:min-w-[20vw]">
                            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                                <option value='critical'>Critical</option>
                                <option value='high'>High</option>
                                <option value='medium'>Medium</option>
                                <option value='low'>Low</option>
                            </select>
                        </label>

                        <label className="label">Service Name</label>
                        <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} type="text" className="input mb-4 lg:min-w-[20vw]" placeholder={incident?.service_name} />
                        <RenderResolvedAtField />
                    </div>
                    <div className="flex flex-col items-center">
                        <button onClick={() => {
                            patchIncident()
                            modalRef.current?.close()
                        }} className={`btn ${submitBtnBg} border-base-content mt-2 px-6`} onMouseEnter={() => setSubmitBtnBg("btn-info")} onMouseLeave={() => setSubmitBtnBg("btn-neutral")}>Edit</button>
                    </div>
                </fieldset>
                <div className="modal-action">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                        {/* <span>Close</span> */}
                    </form>
                </div>
            </div>
        </dialog>
        </>
    )
}

const HandleEdit = (fetcher: FetcherWithComponents<any>, incident: any, id: string) => {
    fetcher.submit(incident,
        {
            method: "PATCH",
            action: `/api/incidents/edit/${id}`,
            encType: "application/json"
        }
    )
}
