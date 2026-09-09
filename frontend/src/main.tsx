// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { Root } from './Root'
import { HomePage } from './components/HomePage'
import { IncidentAdd } from './components/IncidentAdd'
import { Settings } from './components/Settings'
import { LoadingSpinner } from './components/Loading'
import { GetReportLoader } from './functions/getReport.loader'
import { IncidentList } from './components/IncidentList'
import { GetIncidentsLoader } from './functions/getIncidents.loader'
import { GetHealthzLoader } from './functions/getHealthz.loader'
import { IncidentReportCenter } from './components/IncidentReport'
import { GetIncidentLoader } from './functions/getIncident.loader'
import { AddIncidentAction, AddIncidentsAction } from './functions/addIncident.action'
import { EditIncidentAction } from './functions/editIncident.action'
import { DeleteIncidentAction } from './functions/deleteIncident.action'
import { ErrorBoundary } from './components/ErrorBoundary'

// Create redirect url interceptor
const originalFetch = window.fetch
window.fetch = async (input, init) => {
    const response = await originalFetch(input, init)
    const redirectUrl = response.headers.get("X-Redirect-Url")
    if (redirectUrl) window.location.href = redirectUrl
    return response
}

const router = createBrowserRouter([
    {
        path: "/",
        Component: Root,
        children: [
            { index: true, Component: HomePage},
            { path: "add", Component: IncidentAdd},
            {
                path: "browse",
                Component: IncidentList,
                id: "get-incidents",
                loader: GetIncidentsLoader
            },{
                path: "report",
                Component: IncidentReportCenter,
                id: "get-report",
                loader: GetReportLoader
            },{
                path: "settings",
                Component: Settings,
                id: "settings-route"
            }
        ],
        HydrateFallback: LoadingSpinner,
        ErrorBoundary: ErrorBoundary
    },{
        // This is Resource Route
        path: "/api/healthz",
        loader: GetHealthzLoader
    },{
        path: "/api/incidents",
        id: "browse-route",
        loader: GetIncidentsLoader
    },{
        path: "/api/report",
        id: "report-route-public",
        loader: GetReportLoader
    },{
        path: "/api/incident/:id",
        id: "get-incident",
        loader: GetIncidentLoader
    },{
        path: "/api/incident/add",
        id: "add-incident",
        action: AddIncidentAction
    },{
        path: "/api/incidents/add",
        id: "add-incidents",
        action: AddIncidentsAction
    },{
        path: "/api/incidents/edit/:id",
        id: "edit-incident",
        action: EditIncidentAction
    },{
        path: "/api/incident/delete/:id",
        id: "delete-incident",
        action: DeleteIncidentAction
    }
]);

createRoot(document.getElementById('root')!).render(
    // <StrictMode>
    <RouterProvider router={router} />
)
