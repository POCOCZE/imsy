import { HealthStatus } from './components/HealthResponse'
import { EnableMenu } from './components/EnableMenu';
import { Outlet } from 'react-router';
import { UserButton } from './components/UserButton';
import { ToastContainer } from 'react-toastify';

export const Root = () => {
    return (
        <div className='flex bg-base-300 h-screen'>
            <ToastContainer
                position='top-right'
                autoClose={5000}
                hideProgressBar={false}
            />
            {/* Left side */}
            <div className='flex flex-col justify-between items-center mb-2'>
                <EnableMenu />
                <div className='flex flex-col items-center'>
                    <UserButton />
                    <HealthStatus />
                </div>
            </div>
            <div className="flex flex-col grow rounded-lg justify-start bg-base-100 my-2 mr-2">
            {/* Center */}
            <Outlet />
            </div>
        </div>
    )
}