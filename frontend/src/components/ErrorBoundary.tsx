import { isRouteErrorResponse, Link, useNavigate, useRouteError } from "react-router"

export const ErrorBoundary = () => {
    const error = useRouteError()
    const navigate = useNavigate()

    // this will work only during developemnt. Detailed error will be in the console log in Developer Settings (F12).
    const ShowErrorDirectly: boolean = import.meta.env.VITE_DEV_MODE

    console.error(error)

    let title = "Something went wrong"
    let message = "An unexpected error occured."

    if (isRouteErrorResponse(error)) {
        title = `${error.status} ${error.statusText}`
        message = error.data?.message ?? "The page you are looking for doesn't exist."
    } else if (error instanceof Error) {
        message = error.message
    }

    return (
        <div className="flex flex-col justify-center items-center">
            <span className="text-xl font-bold mt-2">{title}</span>
            <span className="text-sm text-base-content/80">{message}</span>

            {ShowErrorDirectly && error instanceof Error &&
                <span className="text-xs text-left text-error/90 bg-neutral-900 w-[60vw] p-4 mt-2">{error.stack}</span>
            }

            <div className="flex mt-4">
                <button className="btn m-4 border-base-content/15" onClick={() => navigate(-1)}>Go Back</button>
                <Link to="/" className="btn m-4 border-base-content/15">Go to Dashboard</Link>
            </div>
        </div>
    )
}