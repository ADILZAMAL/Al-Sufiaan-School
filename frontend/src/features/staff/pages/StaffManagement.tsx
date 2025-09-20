import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiUserGroup, HiUsers, HiPencil, HiTrash, HiEye } from 'react-icons/hi';
import { teachingStaffApi } from '../api/teachingStaff';
import { nonTeachingStaffApi } from '../api/nonTeachingStaff';
import { TeachingStaff, NonTeachingStaff } from '../types';
import Toast from '../../../components/common/Toast';

type StaffFilter = 'active' | 'inactive' | 'all';

const StaffManagement: React.FC = () => {
  const [teachingStaff, setTeachingStaff] = useState<TeachingStaff[]>([]);
  const [nonTeachingStaff, setNonTeachingStaff] = useState<NonTeachingStaff[]>([]);
  const [allTeachingStaff, setAllTeachingStaff] = useState<TeachingStaff[]>([]);
  const [allNonTeachingStaff, setAllNonTeachingStaff] = useState<NonTeachingStaff[]>([]);
  const [activeFilter, setActiveFilter] = useState<StaffFilter>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  useEffect(() => {
    fetchStaffData();
  }, []);

  useEffect(() => {
    filterStaffData();
  }, [activeFilter, allTeachingStaff, allNonTeachingStaff]);

  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const [teachingData, nonTeachingData] = await Promise.all([
        teachingStaffApi.getAll(1), // schoolId should come from context/auth
        nonTeachingStaffApi.getAll(1) // schoolId should come from context/auth
      ]);
      setAllTeachingStaff(teachingData);
      setAllNonTeachingStaff(nonTeachingData);
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to fetch staff data', 
        type: 'ERROR' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterStaffData = () => {
    if (activeFilter === 'active') {
      setTeachingStaff(allTeachingStaff.filter(staff => staff.active));
      setNonTeachingStaff(allNonTeachingStaff.filter(staff => staff.active));
    } else if (activeFilter === 'inactive') {
      setTeachingStaff(allTeachingStaff.filter(staff => !staff.active));
      setNonTeachingStaff(allNonTeachingStaff.filter(staff => !staff.active));
    } else {
      setTeachingStaff(allTeachingStaff);
      setNonTeachingStaff(allNonTeachingStaff);
    }
  };

  const handleLeftSchool = async (id: number, type: 'teaching' | 'non-teaching') => {
    if (!window.confirm('Are you sure you want to mark this staff member as left school?')) {
      return;
    }

    try {
      if (type === 'teaching') {
        await teachingStaffApi.markLeftSchool(id);
        setTeachingStaff(prev => prev.map(staff => 
          staff.id === id ? { ...staff, active: false } : staff
        ));
      } else {
        await nonTeachingStaffApi.markLeftSchool(id);
        setNonTeachingStaff(prev => prev.map(staff => 
          staff.id === id ? { ...staff, active: false } : staff
        ));
      }
      setToast({ message: 'Staff member marked as left school successfully!', type: 'SUCCESS' });
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to mark staff member as left school', 
        type: 'ERROR' 
      });
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Staff Management</h1>
        <p className="text-gray-600">Manage teaching and non-teaching staff members</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          to="/dashboard/staff/add-teaching"
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 sm:p-6 rounded-lg shadow-md transition-colors duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between group no-underline hover:no-underline"
        >
          <div className="mb-3 sm:mb-0">
            <h3 className="text-lg font-semibold mb-2">Add Teaching Staff</h3>
            <p className="text-blue-100 text-sm sm:text-base">Add new teaching staff member with subject competencies</p>
          </div>
          <HiPlus className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200 self-end sm:self-auto" />
        </Link>

        <Link
          to="/dashboard/staff/add-non-teaching"
          className="bg-green-600 hover:bg-green-700 text-white p-4 sm:p-6 rounded-lg shadow-md transition-colors duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between group no-underline hover:no-underline"
        >
          <div className="mb-3 sm:mb-0">
            <h3 className="text-lg font-semibold mb-2">Add Non-Teaching Staff</h3>
            <p className="text-green-100 text-sm sm:text-base">Add new non-teaching staff member</p>
          </div>
          <HiPlus className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200 self-end sm:self-auto" />
        </Link>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Staff Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Teaching Staff</p>
              <p className="text-2xl font-bold text-gray-900">{allTeachingStaff.filter(staff => staff.active).length}</p>
            </div>
            <HiUserGroup className="text-3xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Non-Teaching Staff</p>
              <p className="text-2xl font-bold text-gray-900">{allNonTeachingStaff.filter(staff => staff.active).length}</p>
            </div>
            <HiUsers className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Staff</p>
              <p className="text-2xl font-bold text-gray-900">{allTeachingStaff.filter(staff => !staff.active).length + allNonTeachingStaff.filter(staff => !staff.active).length}</p>
            </div>
            <HiUsers className="text-3xl text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{allTeachingStaff.length + allNonTeachingStaff.length}</p>
            </div>
            <HiUserGroup className="text-3xl text-purple-500" />
          </div>
        </div>
      </div>

      {/* Staff List Section */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Header with Tabs */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">Staff Members</h2>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveFilter('active')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeFilter === 'active'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Active ({allTeachingStaff.filter(staff => staff.active).length + allNonTeachingStaff.filter(staff => staff.active).length})
              </button>
              <button
                onClick={() => setActiveFilter('inactive')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeFilter === 'inactive'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Inactive ({allTeachingStaff.filter(staff => !staff.active).length + allNonTeachingStaff.filter(staff => !staff.active).length})
              </button>
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeFilter === 'all'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All ({allTeachingStaff.length + allNonTeachingStaff.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading staff data...</p>
            </div>
          ) : teachingStaff.length > 0 || nonTeachingStaff.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Teaching Staff */}
                    {teachingStaff.map((staff) => (
                      <tr key={`teaching-${staff.id}`} className={`hover:bg-gray-50 ${!staff.active ? 'opacity-60 bg-gray-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                            {staff.photoUrl ? (
                              <img
                                src={staff.photoUrl.startsWith('http') ? staff.photoUrl : `${import.meta.env.VITE_BACKEND_API_BASE_URL}/${staff.photoUrl}`}
                                alt={staff.name}
                                className={`w-full h-full object-cover ${!staff.active ? 'grayscale' : ''}`}
                              />
                            ) : (
                              <span className="text-gray-500 text-xs font-medium">
                                {staff.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${staff.active ? 'text-gray-900' : 'text-gray-500'}`}>
                            {staff.name}
                            {!staff.active && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{staff.gender}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Teaching
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${staff.active ? 'text-gray-900' : 'text-gray-500'}`}>{staff.role || 'Not specified'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${staff.active ? 'text-gray-900' : 'text-gray-500'}`}>{staff.email}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${staff.active ? 'text-gray-900' : 'text-gray-500'}`}>{staff.mobileNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={`/dashboard/staff/view/teaching/${staff.id}`}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="View Details"
                            >
                              <HiEye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/dashboard/staff/edit/teaching/${staff.id}`}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Edit Staff"
                            >
                              <HiPencil className="h-4 w-4" />
                            </Link>
                            {staff.active && (
                              <button
                                onClick={() => handleLeftSchool(staff.id!, 'teaching')}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                                title="Left School"
                              >
                                <HiTrash className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Non-Teaching Staff */}
                    {nonTeachingStaff.map((staff) => (
                      <tr key={`non-teaching-${staff.id}`} className={`hover:bg-gray-50 ${!staff.active ? 'opacity-60 bg-gray-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                            {staff.photoUrl ? (
                              <img
                                src={staff.photoUrl.startsWith('http') ? staff.photoUrl : `${import.meta.env.VITE_BACKEND_API_BASE_URL}/${staff.photoUrl}`}
                                alt={staff.name}
                                className={`w-full h-full object-cover ${!staff.active ? 'grayscale' : ''}`}
                              />
                            ) : (
                              <span className="text-gray-500 text-xs font-medium">
                                {staff.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${staff.active ? 'text-gray-900' : 'text-gray-500'}`}>
                            {staff.name}
                            {!staff.active && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{staff.gender}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Non-Teaching
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${staff.active ? 'text-gray-900' : 'text-gray-500'}`}>{staff.role || 'Not specified'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${staff.active ? 'text-gray-900' : 'text-gray-500'}`}>{staff.email}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${staff.active ? 'text-gray-900' : 'text-gray-500'}`}>{staff.mobileNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={`/dashboard/staff/view/non-teaching/${staff.id}`}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="View Details"
                            >
                              <HiEye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/dashboard/staff/edit/non-teaching/${staff.id}`}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Edit Staff"
                            >
                              <HiPencil className="h-4 w-4" />
                            </Link>
                            {staff.active && (
                              <button
                                onClick={() => handleLeftSchool(staff.id!, 'non-teaching')}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                                title="Left School"
                              >
                                <HiTrash className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4">
                {/* Teaching Staff Cards */}
                {teachingStaff.map((staff) => (
                  <div key={`teaching-card-${staff.id}`} className={`rounded-lg p-4 border ${!staff.active ? 'bg-gray-100 border-gray-300 opacity-75' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                        {staff.photoUrl ? (
                          <img
                            src={staff.photoUrl.startsWith('http') ? staff.photoUrl : `${import.meta.env.VITE_BACKEND_API_BASE_URL}/${staff.photoUrl}`}
                            alt={staff.name}
                            className={`w-full h-full object-cover ${!staff.active ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">
                            {staff.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`text-sm font-medium truncate ${staff.active ? 'text-gray-900' : 'text-gray-500'}`}>
                              {staff.name}
                              {!staff.active && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Inactive
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Teaching
                              </span>
                              <span className="text-xs text-gray-500">{staff.gender}</span>
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <Link
                              to={`/dashboard/staff/view/teaching/${staff.id}`}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                              title="View Details"
                            >
                              <HiEye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/dashboard/staff/edit/teaching/${staff.id}`}
                              className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50"
                              title="Edit Staff"
                            >
                              <HiPencil className="h-4 w-4" />
                            </Link>
                            {staff.active && (
                              <button
                                onClick={() => handleLeftSchool(staff.id!, 'teaching')}
                                className="text-orange-600 hover:text-orange-900 p-2 rounded hover:bg-orange-50"
                                title="Left School"
                              >
                                <HiTrash className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className={`text-xs ${staff.active ? 'text-gray-600' : 'text-gray-500'}`}>
                            <span className="font-medium">Role:</span> {staff.role || 'Not specified'}
                          </p>
                          <p className={`text-xs truncate ${staff.active ? 'text-gray-600' : 'text-gray-500'}`}>
                            <span className="font-medium">Email:</span> {staff.email}
                          </p>
                          <p className={`text-xs ${staff.active ? 'text-gray-600' : 'text-gray-500'}`}>
                            <span className="font-medium">Mobile:</span> {staff.mobileNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Non-Teaching Staff Cards */}
                {nonTeachingStaff.map((staff) => (
                  <div key={`non-teaching-card-${staff.id}`} className={`rounded-lg p-4 border ${!staff.active ? 'bg-gray-100 border-gray-300 opacity-75' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                        {staff.photoUrl ? (
                          <img
                            src={staff.photoUrl.startsWith('http') ? staff.photoUrl : `${import.meta.env.VITE_BACKEND_API_BASE_URL}/${staff.photoUrl}`}
                            alt={staff.name}
                            className={`w-full h-full object-cover ${!staff.active ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">
                            {staff.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`text-sm font-medium truncate ${staff.active ? 'text-gray-900' : 'text-gray-500'}`}>
                              {staff.name}
                              {!staff.active && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Inactive
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Non-Teaching
                              </span>
                              <span className="text-xs text-gray-500">{staff.gender}</span>
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <Link
                              to={`/dashboard/staff/view/non-teaching/${staff.id}`}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                              title="View Details"
                            >
                              <HiEye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/dashboard/staff/edit/non-teaching/${staff.id}`}
                              className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50"
                              title="Edit Staff"
                            >
                              <HiPencil className="h-4 w-4" />
                            </Link>
                            {staff.active && (
                              <button
                                onClick={() => handleLeftSchool(staff.id!, 'non-teaching')}
                                className="text-orange-600 hover:text-orange-900 p-2 rounded hover:bg-orange-50"
                                title="Left School"
                              >
                                <HiTrash className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className={`text-xs ${staff.active ? 'text-gray-600' : 'text-gray-500'}`}>
                            <span className="font-medium">Role:</span> {staff.role || 'Not specified'}
                          </p>
                          <p className={`text-xs truncate ${staff.active ? 'text-gray-600' : 'text-gray-500'}`}>
                            <span className="font-medium">Email:</span> {staff.email}
                          </p>
                          <p className={`text-xs ${staff.active ? 'text-gray-600' : 'text-gray-500'}`}>
                            <span className="font-medium">Mobile:</span> {staff.mobileNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <HiUserGroup className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
              <p className="mt-1 text-sm text-gray-500">Staff members will appear here once added.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
