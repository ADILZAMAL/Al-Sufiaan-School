import React from 'react';
import { Outlet } from 'react-router-dom';

const TransportationLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content Area */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default TransportationLayout;
