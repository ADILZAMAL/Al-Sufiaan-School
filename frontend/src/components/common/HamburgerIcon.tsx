import React from 'react';
import { useAppContext } from '../../providers/AppContext';

const HamburgerIcon: React.FC = () => {
    const { isSidebarOpen, toggleSidebar } = useAppContext();

    return (
        <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            aria-label="Toggle sidebar"
        >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
                <div className={`w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isSidebarOpen ? 'rotate-45 translate-y-1.5' : 'mb-1'}`}></div>
                <div className={`w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isSidebarOpen ? 'opacity-0' : 'mb-1'}`}></div>
                <div className={`w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isSidebarOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
            </div>
        </button>
    );
};

export default HamburgerIcon;
