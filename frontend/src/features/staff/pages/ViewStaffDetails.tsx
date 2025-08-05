import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiPencil, HiTrash } from 'react-icons/hi';
import { teachingStaffApi } from '../api/teachingStaff';
import { nonTeachingStaffApi } from '../api/nonTeachingStaff';
import { TeachingStaff, NonTeachingStaff } from '../types';
import Toast from '../../../components/common/Toast';

const ViewStaffDetails: React.FC = () => {
  const { type, id } = useParams<{ type: 'teaching' | 'non-teaching'; id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<TeachingStaff | NonTeachingStaff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  useEffect(() => {
    fetchStaffDetails();
  }, [type, id]);

  const fetchStaffDetails = async () => {
    if (!type || !id) return;
    
    setIsLoading(true);
    try {
      let staffData;
      if (type === 'teaching') {
        staffData = await teachingStaffApi.getById(parseInt(id));
      } else {
        staffData = await nonTeachingStaffApi.getById(parseInt(id));
      }
      setStaff(staffData);
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to fetch staff details', 
        type: 'ERROR' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeftSchool = async () => {
    if (!staff?.id || !type) return;
    
    if (!window.confirm('Are you sure you want to mark this staff member as left school?')) {
      return;
    }

    try {
      if (type === 'teaching') {
        await teachingStaffApi.markLeftSchool(staff.id);
      } else {
        await nonTeachingStaffApi.markLeftSchool(staff.id);
      }
      setToast({ message: 'Staff member marked as left school successfully!', type: 'SUCCESS' });
      setTimeout(() => navigate('/dashboard/staff'), 2000);
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to mark staff member as left school', 
        type: 'ERROR' 
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Staff member not found</p>
          <Link to="/dashboard/staff" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Back to Staff Management
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {type === 'teaching' ? 'Teaching' : 'Non-Teaching'} Staff Details
        </h1>
        <p className="text-gray-600">View details for {staff.name}</p>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Actions */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/dashboard/staff"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <HiArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff List
        </Link>

        <div className="flex space-x-3">
          <Link
            to={`/dashboard/staff/edit/${type}/${staff.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <HiPencil className="h-4 w-4 mr-2" />
            Edit Staff
          </Link>
          <button
            onClick={handleLeftSchool}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
          >
            <HiTrash className="h-4 w-4 mr-2" />
            Left School
          </button>
        </div>
      </div>

      {/* Staff Details */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              <div className="flex items-start space-x-6">
                {/* Photo */}
                {staff.photoUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={staff.photoUrl.startsWith('http') ? staff.photoUrl : `${import.meta.env.VITE_BACKEND_API_BASE_URL}/${staff.photoUrl}`}
                      alt={staff.name}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
                
                {/* Personal Details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Gender</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.gender}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(staff.dateOfBirth)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Social Category</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.socialCategory || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mobile Number</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.mobileNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Aadhaar Number</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.aadhaarNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name as per Aadhaar</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.nameAsPerAadhaar}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Qualifications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Qualifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Highest Academic Qualification</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.highestAcademicQualification || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Trade/Degree</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.tradeDegree || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Role Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.role || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Staff Type</label>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      type === 'teaching' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {type === 'teaching' ? 'Teaching' : 'Non-Teaching'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Subject Competencies (Teaching Staff Only) */}
            {type === 'teaching' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject Competencies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mathematics</label>
                    <p className="mt-1 text-sm text-gray-900">{(staff as TeachingStaff).mathematicsLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Science</label>
                    <p className="mt-1 text-sm text-gray-900">{(staff as TeachingStaff).scienceLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">English</label>
                    <p className="mt-1 text-sm text-gray-900">{(staff as TeachingStaff).englishLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Social Science</label>
                    <p className="mt-1 text-sm text-gray-900">{(staff as TeachingStaff).socialScienceLevel || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Language (Schedule VIII)</label>
                    <p className="mt-1 text-sm text-gray-900">{(staff as TeachingStaff).scheduleVIIILanguageLevel || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Employment Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Type of Disability</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.typeOfDisability || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nature of Appointment</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.natureOfAppointment || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date of Joining Service</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(staff.dateOfJoiningService!)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date of Joining Present School</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(staff.dateOfJoiningPresentSchool!)}</p>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Salary per Month</label>
                  <p className="mt-1 text-sm text-gray-900">₹{staff.salaryPerMonth || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">UPI Number</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.upiNumber || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Number</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.accountNumber || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Name</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.accountName || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">IFSC Code</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.ifscCode || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStaffDetails;
