import React from 'react';
import { Outlet } from 'react-router-dom';

const ExpenseLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content Area - Navigation is now handled in the sidebar */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default ExpenseLayout;
