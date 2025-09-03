import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const FeeLayout: React.FC = () => {
  const navItems = [
    {
      path: '/dashboard/fee/categories',
      label: 'Fee Categories',
      description: 'Manage fee types and categories'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content Area */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default FeeLayout;
