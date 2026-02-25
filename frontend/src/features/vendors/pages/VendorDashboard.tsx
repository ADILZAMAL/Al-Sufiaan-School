import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPlus } from 'react-icons/hi';
import { FaBuilding, FaPhone, FaTag } from 'react-icons/fa';
import { fetchVendors } from '../api';
import { Vendor } from '../types';
import AddVendorModal from '../components/AddVendorModal';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-emerald-100 text-emerald-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
];

const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const VendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const vendorList = await fetchVendors();
      setVendors(vendorList);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVendorSuccess = () => {
    loadVendors();
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage all your school vendors</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
          >
            <HiPlus className="w-4 h-4" />
            Add Vendor
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaBuilding className="text-blue-300" size={22} />
            </div>
            <p className="text-gray-700 font-semibold">No vendors yet</p>
            {vendors.length === 0 && (
              <>
                <p className="text-gray-400 text-sm mt-1">Add your first vendor to get started</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  <HiPlus className="w-4 h-4" />
                  Add First Vendor
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                onClick={() => navigate(`/dashboard/expense/vendors/${vendor.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-150 group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${getAvatarColor(vendor.name)}`}
                  >
                    {vendor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                        {vendor.name}
                      </h3>
                      <span
                        className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                          vendor.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FaPhone size={10} className="text-gray-400 shrink-0" />
                        <span>{vendor.mobile}</span>
                      </div>
                      {vendor.category && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <FaTag size={10} className="text-gray-400 shrink-0" />
                          <span>{vendor.category.name}</span>
                        </div>
                      )}
                      {vendor.upiNumberId && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="font-mono truncate">{vendor.upiNumberId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddVendorSuccess}
      />
    </div>
  );
};

export default VendorDashboard;
