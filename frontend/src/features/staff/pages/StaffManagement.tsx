import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiUserGroup, HiUsers, HiPencil, HiTrash } from 'react-icons/hi';
import { teachingStaffApi } from '../api/teachingStaff';
import { nonTeachingStaffApi } from '../api/nonTeachingStaff';
import { TeachingStaff, NonTeachingStaff } from '../types';
import Toast from '../../../components/common/Toast';

const StaffManagement: React.FC = () => {
  const [teachingStaff, setTeachingStaff] = useState<TeachingStaff[]>([]);
  const [nonTeachingStaff, setNonTeachingStaff] = useState<NonTeachingStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const [teachingData, nonTeachingData] = await Promise.all([
        teachingStaffApi.getAll(1), // schoolId should come from context/auth
        nonTeachingStaffApi.getAll(1) // schoolId should come from context/auth
      ]);
      setTeachingStaff(teachingData);
      setNonTeachingStaff(nonTeachingData);
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to fetch staff data', 
        type: 'ERROR' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, type: 'teaching' | 'non-teaching') => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      if (type === 'teaching') {
        await teachingStaffApi.delete(id);
        setTeachingStaff(prev => prev.filter(staff => staff.id !== id));
      } else {
        await nonTeachingStaffApi.delete(id);
        setNonTeachingStaff(prev => prev.filter(staff => staff.id !== id));
      }
      setToast({ message: 'Staff member deleted successfully!', type: 'SUCCESS' });
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to delete staff member', 
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          to="/dashboard/staff/add-teaching"
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-between group no-underline hover:no-underline"
        >
          <div>
            <h3 className="text-lg font-semibold mb-2">Add Teaching Staff</h3>
            <p className="text-blue-100">Add new teaching staff member with subject competencies</p>
          </div>
          <HiPlus className="text-3xl group-hover:scale-110 transition-transform duration-200" />
        </Link>

        <Link
          to="/dashboard/staff/add-non-teaching"
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-between group no-underline hover:no-underline"
        >
          <div>
            <h3 className="text-lg font-semibold mb-2">Add Non-Teaching Staff</h3>
            <p className="text-green-100">Add new non-teaching staff member</p>
          </div>
          <HiPlus className="text-3xl group-hover:scale-110 transition-transform duration-200" />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teaching Staff</p>
              <p className="text-2xl font-bold text-gray-900">{teachingStaff.length}</p>
            </div>
            <HiUserGroup className="text-3xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Non-Teaching Staff</p>
              <p className="text-2xl font-bold text-gray-900">{nonTeachingStaff.length}</p>
            </div>
            <HiUsers className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{teachingStaff.length + nonTeachingStaff.length}</p>
            </div>
            <HiUserGroup className="text-3xl text-purple-500" />
          </div>
        </div>
      </div>

      {/* Staff List Section */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Staff Members</h2>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading staff data...</p>
            </div>
          ) : teachingStaff.length > 0 || nonTeachingStaff.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Teaching Staff */}
                  {teachingStaff.map((staff) => (
                    <tr key={`teaching-${staff.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {staff.photoUrl ? (
                            <img
                              src={staff.photoUrl.startsWith('http') ? staff.photoUrl : `${import.meta.env.VITE_BACKEND_API_BASE_URL}/${staff.photoUrl}`}
                              alt={staff.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 text-xs font-medium">
                              {staff.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-500">{staff.gender}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Teaching
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.role || 'Not specified'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.mobileNumber}</td>
                    </tr>
                  ))}
                  {/* Non-Teaching Staff */}
                  {nonTeachingStaff.map((staff) => (
                    <tr key={`non-teaching-${staff.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {staff.photoUrl ? (
                            <img
                              src={staff.photoUrl.startsWith('http') ? staff.photoUrl : `${import.meta.env.VITE_BACKEND_API_BASE_URL}/${staff.photoUrl}`}
                              alt={staff.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 text-xs font-medium">
                              {staff.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-500">{staff.gender}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Non-Teaching
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.role || 'Not specified'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.mobileNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
