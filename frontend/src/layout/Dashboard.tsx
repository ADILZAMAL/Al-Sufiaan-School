import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../contexts/AppContext';

const Dashboard: React.FC = () => {
    const { isLoggedIn } = useAppContext();
    const navigate = useNavigate();
    if (!isLoggedIn)
        navigate("/sign-in");
    return (
        <div className="bg-neutral-100 h-screen w-screen overflow-hidden flex flex-row">
            <Sidebar />
            <div className="flex flex-col flex-1">
                <div className="flex-1 p-4 min-h-0 overflow-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    )
};

export default Dashboard;