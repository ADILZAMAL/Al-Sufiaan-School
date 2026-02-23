import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import HamburgerIcon from '../common/HamburgerIcon';

const Dashboard: React.FC = () => {
    return (
        <div className="flex flex-row bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <header className="h-16 flex items-center px-4 bg-white border-b border-gray-200 flex-shrink-0 sticky top-0 z-10">
                    <HamburgerIcon />
                </header>
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
