import { Link, useNavigate } from "react-router"
import { useState } from "react";
import cloudIcon from "../assets/cloud.png"

export const Settings = () => {
    const [showBack, setShowBack] = useState<boolean>()
    const AppVersion = import.meta.env.VITE_APP_VERSION

    const SubscriptionSection = () => {
        return (
            <div className="w-100 mb-4">
                <div className="flex pb-0.5 bg-linear-to-r from-transparent via-base-content/50 to-transparent mb-2">
                    <span className="w-full bg-base-100 text-xl font-semibold">Subscription</span>
                </div>
                <div className="flex flex-col mx-4">
                    <div className="flex justify-between text-base-content/90">
                        <span className="font-semibold">Plan</span>
                        <span className="badge badge-sm badge-success border-base-content/80">free</span>
                    </div>
                    <div className="flex justify-between text-base-content/90">
                        <span className="font-semibold">Type</span>
                        <span className="font-light">community</span>
                    </div>
                    <div className="flex justify-between text-base-content/90">
                        <span className="font-semibold">Max members</span>
                        <span className="font-light">1</span>
                    </div>
                </div>
            </div>
        )
    }

    const SeeCloudVariant = () => {
        return (
            <div className="flex flex-col rounded-xl cursor-pointer select-none bg-linear-150 from-amber-400 via-yellow-500 to-amber-600 dark:from-amber-800 dark:via-yellow-800 dark:to-amber-950">
                <div className="flex justify-center items-center mx-10 mt-2">
                    <span className="text-center text-2xl font-semibold">Upgrade to</span>
                    <div>
                        <img src={cloudIcon} alt="Cloud version" width="70" height="70" className="mx-2"/>
                        <span className="fixed top-8.5 right-33.5 text-lg font-bold">cloud</span>
                        {/* <span className="badge badge-md badge-info border-base-content/15 mx-1">cloud</span> */}
                    </div>
                    <span className="text-center text-2xl font-semibold">today!</span>
                </div>
                <div className="flex flex-col mx-6">
                    <div className="flex flex-col text-base-content/95">
                        <span>✓ Built on open-source core</span>
                        <span>✓ More members</span>
                        <span>✓ Data retention</span>
                        <span>✓ Authentication</span>
                        <span>✓ User management</span>
                        <span>✓ Simple pricing</span>
                        <span>✓ Strong security practices</span>
                    </div>
                    <div className="flex justify-center items-center m-2">
                        <button className="btn btn-sm border-base-content/80 items-center">Take a look</button>
                    </div>
                </div>
            </div>
        )
    }

    const navigate = useNavigate();
    return (
        <div className="flex flex-col m-4 rounded items-center">
            <div className="flex w-130">
                <div className="flex justify-start items-center w-16" onMouseEnter={() => setShowBack(true)} onMouseLeave={() => setShowBack(false)}>
                    <button className="btn btn-neutral bg-base-100 text-base-content border-none rounded-none p-1 w-fit" onClick={() => navigate(-1)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                        <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
                        </svg>
                        {showBack &&
                            <span className="text-md font-light">Back</span>}
                    </button>
                </div>
                <div className="flex grow justify-center mr-16">
                    <span className="text-3xl font-bold">Settings</span>
                </div>
            </div>
                <div>{SubscriptionSection()}</div>
                {/* Todo: Redirect your to pricing page */}
                <div className="aura aura-gold duration-10000 my-4" onClick={() => {
                    window.location.href = "https://pradka.dev/pricing"
                }}>{SeeCloudVariant()}</div>
            <div className="flex mt-4">
                <span className="label mr-1">Version</span>
                <span className="font-light">{AppVersion}</span>
            </div>
            <div className="flex">
                <span className="label mr-1">Built by</span>
                <span className="font-semibold">PradkaDotDev</span>
            </div>
        </div>
    )
}

export const SettingsButton = () => {
    return (
        <Link to="/settings" className="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
            </svg>
            Settings
        </Link>
    )
}