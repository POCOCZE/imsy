import { createPortal } from "react-dom"
import { SettingsButton } from "./Settings"
import { useRef } from "react"
import cloudIcon from "../assets/cloud.png"

export const UserButton = () => {
    const popoverRef = useRef<HTMLUListElement>(null)

    const handleNavigate = () => {
        popoverRef.current?.hidePopover()
    }

    return (
        <>
            {/* User button */}
            <button className="btn btn-ghost btn-xs bg-base-200 m-2 py-4 border border-base-content/15" popoverTarget="user-button-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
            </button>
            {createPortal(
                <ul ref={popoverRef} className="dropdown menu rounded-box bg-base-100 w-52 border border-base-content/15 absolute inset-auto bottom-10 left-12 m-0 z-50" popover="auto" id="user-button-1">
                    <li className="flex justify-start text-left w-full *:justify-start" onClick={handleNavigate}>
                        {/* User profile button */}
                        <button className="btn btn-ghost btn-sm" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                            </svg>
                        Edit profile
                        <AvailableInCloudIcon />
                        </button>
                    </li>
                    <li className="flex justify-start text-left w-full *:justify-start" onClick={handleNavigate}>
                        {/* Team button */}
                        <button className="btn btn-ghost btn-sm" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
                            </svg>
                        Team
                        <AvailableInCloudIcon />
                        </button>
                    </li>
                    <li className="flex justify-start text-left w-full *:justify-start border-b border-base-content/15" onClick={handleNavigate}><SettingsButton /></li>
                    <li className="flex justify-start text-left w-full *:justify-start">
                        {/* Log out button */}
                        <button className="btn btn-ghost btn-sm" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V15a.75.75 0 0 0-1.5 0v3.75a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3V9A.75.75 0 1 0 9 9V5.25a1.5 1.5 0 0 1 1.5-1.5h6ZM5.78 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 0 0 0 1.06l3 3a.75.75 0 0 0 1.06-1.06l-1.72-1.72H15a.75.75 0 0 0 0-1.5H4.06l1.72-1.72a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" />
                            </svg>
                        Log out
                        <AvailableInCloudIcon />
                        </button>
                    </li>
                </ul>
                , document.body
            )}
        </>
    )
}

const AvailableInCloudIcon = () => {
    return (
        <div className="flex justify-end grow">
            <img src={cloudIcon} alt="Cloud version" width="25" height="25" className="grayscale mx-2"/>
            {/* <span className="absolute top-1.5 right-5.5 text-sm font-bold">cloud</span> */}
            {/* <span className="badge badge-md badge-info border-base-content/15 mx-1">cloud</span> */}
        </div>
    )
}