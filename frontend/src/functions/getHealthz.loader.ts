export interface GetHealthzLoaderData {
    status: string | null,
    error: string | null
}

export const GetHealthzLoader = async (): Promise<GetHealthzLoaderData> => {
    try {
        const response = await fetch("/api/healthz", {
            method: "GET",
            credentials: "include",
        })
        if (!response.ok) throw new Error()
        const data = await response.json()
        return { status: data.status, error: null}
    } catch (err) {
        return { status: null, error: `API Offline`}
    }
}