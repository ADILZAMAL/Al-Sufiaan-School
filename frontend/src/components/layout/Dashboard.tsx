import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import HamburgerIcon from '../common/HamburgerIcon';
import { useAppContext } from '../../providers/AppContext';

const Dashboard: React.FC = () => {
    const { isLoggedIn, isSidebarOpen } = useAppContext();
    const navigate = useNavigate();
    if (!isLoggedIn)
        navigate("/sign-in");
    return (
        <div className="bg-neutral-100 h-screen w-screen flex flex-row">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center p-4 bg-white border-b border-gray-200">
                    <HamburgerIcon />
                    <h1 className="ml-4 text-xl font-semibold text-gray-800">Dashboard</h1>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    )
};

export default Dashboard;
