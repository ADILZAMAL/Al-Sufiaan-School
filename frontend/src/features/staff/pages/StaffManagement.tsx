import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiUserGroup, HiUsers, HiPencil, HiTrash, HiEye, HiSearch } from 'react-icons/hi';
import { FaEnvelope, FaPhone } from 'react-icons/fa';
import { staffApi } from '../api/staff';
import { Staff } from '../types';
import Toast from '../../../components/common/Toast';

type StaffFilter = 'active' | 'inactive' | 'all';

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

const StaffManagement: React.FC = () => {
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [activeFilter, setActiveFilter] = useState<StaffFilter>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const data = await staffApi.getAll(1);
      setAllStaff(data);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to fetch staff data', type: 'ERROR' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeftSchool = async (id: number) => {
    if (!window.confirm('Are you sure you want to mark this staff member as left school?')) return;
    try {
      await staffApi.markLeftSchool(id);
      setAllStaff((prev) =>
        prev.map((staff) => (staff.id === id ? { ...staff, active: false } : staff))
      );
      setToast({ message: 'Staff member marked as left school successfully!', type: 'SUCCESS' });
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to mark staff member as left school',
        type: 'ERROR',
      });
    }
  };

  const activeTeaching = allStaff.filter((s) => s.active && s.staffType === 'teaching').length;
  const activeNonTeaching = allStaff.filter(
    (s) => s.active && s.staffType === 'non-teaching'
  ).length;
  const inactive = allStaff.filter((s) => !s.active).length;

  const byFilter =
    activeFilter === 'active'
      ? allStaff.filter((s) => s.active)
      : activeFilter === 'inactive'
      ? allStaff.filter((s) => !s.active)
      : allStaff;

  const filteredStaff = searchTerm.trim()
    ? byFilter.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.role ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : byFilter;

  const tabs = [
    { key: 'active' as StaffFilter, label: 'Active', count: activeTeaching + activeNonTeaching },
    { key: 'inactive' as StaffFilter, label: 'Inactive', count: inactive },
    { key: 'all' as StaffFilter, label: 'All', count: allStaff.length },
  ];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage teaching and non-teaching staff members
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/staff/add?type=teaching"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
            >
              <HiPlus className="w-4 h-4" />
              Add Teaching
            </Link>
            <Link
              to="/dashboard/staff/add?type=non-teaching"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
            >
              <HiPlus className="w-4 h-4" />
              Add Non-Teaching
            </Link>
          </div>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <HiUserGroup className="text-blue-600 w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Teaching</p>
                <p className="text-xl font-bold text-gray-900">{activeTeaching}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <HiUsers className="text-emerald-600 w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Non-Teaching</p>
                <p className="text-xl font-bold text-gray-900">{activeNonTeaching}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <HiUsers className="text-red-500 w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Inactive</p>
                <p className="text-xl font-bold text-gray-900">{inactive}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <HiUserGroup className="text-purple-600 w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total</p>
                <p className="text-xl font-bold text-gray-900">{allStaff.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search + Tabs row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, role or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeFilter === tab.key
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <HiUserGroup className="text-gray-300 w-6 h-6" />
            </div>
            <p className="text-gray-700 font-semibold">
              {allStaff.length === 0 ? 'No staff members yet' : 'No staff match your search'}
            </p>
            {allStaff.length === 0 && (
              <p className="text-gray-400 text-sm mt-1">Add your first staff member to get started</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className={`bg-white rounded-xl border transition-all duration-150 overflow-hidden ${
                  staff.active
                    ? 'border-gray-200 hover:border-blue-200 hover:shadow-md'
                    : 'border-gray-200 opacity-60'
                }`}
              >
                {/* Card top */}
                <div className="p-4 flex items-start gap-3">
                  <div className="shrink-0">
                    {staff.photoUrl ? (
                      <img
                        src={
                          staff.photoUrl.startsWith('http')
                            ? staff.photoUrl
                            : `${import.meta.env.VITE_BACKEND_API_BASE_URL}/${staff.photoUrl}`
                        }
                        alt={staff.name}
                        className={`w-11 h-11 rounded-xl object-cover ${
                          !staff.active ? 'grayscale' : ''
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base ${
                          staff.active ? getAvatarColor(staff.name) : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{staff.name}</p>
                      {!staff.active && (
                        <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          staff.staffType === 'teaching'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {staff.staffType === 'teaching' ? 'Teaching' : 'Non-Teaching'}
                      </span>
                      {staff.role && (
                        <span className="text-xs text-gray-500 truncate">{staff.role}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="px-4 pb-3 space-y-1.5 border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaEnvelope size={10} className="text-gray-400 shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaPhone size={10} className="text-gray-400 shrink-0" />
                    <span>{staff.mobileNumber}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-end gap-1">
                  <Link
                    to={`/dashboard/staff/view/${staff.id}`}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="View Details"
                  >
                    <HiEye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/dashboard/staff/edit/${staff.id}`}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                    title="Edit Staff"
                  >
                    <HiPencil className="w-4 h-4" />
                  </Link>
                  {staff.active && (
                    <button
                      onClick={() => handleLeftSchool(staff.id!)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition"
                      title="Mark as Left School"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default StaffManagement;
