import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {FiUser, FiPhone, FiCalendar, FiBookOpen, FiMapPin, FiMail, FiHome, FiBriefcase, FiUserCheck, FiClock, FiEdit, FiDollarSign, FiPrinter, FiCheckCircle } from 'react-icons/fi';
import { useQuery } from "react-query";
import { getStudentById, getStudentFeeTimeline } from '../api';
import { getSchoolById } from '../../../api/school';
import { Student } from '../types';
import EditStudentModal from '../components/EditStudentModal';
import AdmissionFormModal from '../components/AdmissionFormModal';
import FeeTimeline from '../components/FeeTimeline';

const formatDateOnly = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

const getClassName = (student: Student) => {
  return `${student.class.name} - ${student.section.name}`;
};

const getCreator = (student: Student) => {
  if (!student.creator) return 'N/A';
  return `${student.creator.firstName} ${student.creator.lastName}`;
};

const ViewStudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdmissionFormOpen, setIsAdmissionFormOpen] = useState(false);

  const { data: student, isLoading, error, refetch } = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudentById(Number(id)),
    enabled: !!id,
  });

  const { data: feeTimelineData, isLoading: timelineLoading, refetch: refetchTimeline } = useQuery({
    queryKey: ['studentFeeTimeline', id],
    queryFn: () => getStudentFeeTimeline(Number(id)),
    enabled: !!id,
  });

  const { data: school } = useQuery({
    queryKey: ['school', student?.schoolId],
    queryFn: () => getSchoolById(student!.schoolId),
    enabled: !!student?.schoolId,
  });

  const feeTimeline = feeTimelineData?.data || [];

  // Fetch transportation area if student has one
  const { data: transportationArea } = useQuery({
    queryKey: ['transportationArea', student?.areaTransportationId],
    queryFn: async () => {
      if (!student?.areaTransportationId) return null;
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/transportation-area-pricing/${student.areaTransportationId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      return data.success ? data.data : null;
    },
    enabled: !!student?.areaTransportationId
  });

  const handleFeeTimelineRefresh = () => {
    refetchTimeline();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading student profile...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="bg-red-100 rounded-full p-4">
          <FiUser className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Student not found</h3>
        <button
          onClick={() => navigate('/dashboard/students')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
              <p className="mt-1 text-sm text-gray-500">View and manage student information</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsAdmissionFormOpen(true)}
                className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <FiPrinter className="h-4 w-4" />
                <span>Print Admission Form</span>
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <FiEdit className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Student Profile Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {student.studentPhoto ? (
              <img
                src={student.studentPhoto}
                alt={`${student.firstName} ${student.lastName}`}
                className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
              </div>
            )}
            <div className="text-center sm:text-left flex-1">
              <h3 className="text-3xl font-bold text-gray-900 capitalize mb-2">
                {student.firstName} {student.lastName}
              </h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 justify-center sm:justify-start">
                <div className="flex items-center">
                  <span className="font-medium text-gray-700">Admission No:</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-semibold">{student.admissionNumber}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700">Class:</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-md font-semibold">{getClassName(student)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700">Roll No:</span>
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-semibold">{student.rollNumber || 'N/A'}</span>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                Gender: <span className="font-medium">{student.gender}</span> | 
                DOB: <span className="font-medium">{formatDateOnly(student.dateOfBirth)}</span> | 
                Blood Group: <span className="font-medium">{student.bloodGroup || 'N/A'}</span> | 
                Aadhaar: <span className="font-medium">{student.aadhaarNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        {(student.hostel || student.dayboarding || student.areaTransportationId) && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FiBriefcase className="h-5 w-5 mr-2 text-indigo-600" />
              Active Services
            </h3>
            <div className="flex flex-wrap gap-3">
              {/* Hostel Badge */}
              {student.hostel && (
                <div className="inline-flex items-center px-4 py-2 bg-green-100 border border-green-300 rounded-full text-sm font-medium text-green-800">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-6.586a1 1 0 00-.293-.707l-1-1z" />
                  </svg>
                  Hostel Service
                  <FiCheckCircle className="w-3 h-3 ml-2" />
                </div>
              )}
              
              {/* Dayboarding Badge */}
              {student.dayboarding && (
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-300 rounded-full text-sm font-medium text-blue-800">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  Dayboarding Service
                  <FiCheckCircle className="w-3 h-3 ml-2" />
                </div>
              )}
              
              {/* Transportation Badge */}
              {student.areaTransportationId && (
                <div className="inline-flex items-center px-4 py-2 bg-purple-100 border border-purple-300 rounded-full text-sm font-medium text-purple-800">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 1 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM8 9a4 4 0 118 0 4 4 0 01-8 0zm-5 1a.5.5 0 01.5-.5 3.5 3.5 0 000-7H.5a.5.5 0 010 1h3.5a4.5 4.5 0 000 9h.5a.5.5 0 010-1h-.5a3.5 3.5 0 000-7z" />
                  </svg>
                  Transportation: <span className="font-semibold">{transportationArea?.areaName || 'Loading...'}</span> 
                  {transportationArea?.price && (
                    <span className="ml-1">(<span className="font-bold">₹{transportationArea.price}</span>/month)</span>
                  )}
                  <FiCheckCircle className="w-3 h-3 ml-2" />
                </div>
              )}
              
              {/* No Services Message */}
              {!student.hostel && !student.dayboarding && !student.areaTransportationId && (
                <span className="text-sm text-gray-500 italic">No additional services</span>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-8">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
              <FiPhone className="h-5 w-5 mr-2 text-green-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Father's Contact</label>
                <div className="flex items-center">
                  <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900 font-medium">{student.fatherPhone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Mother's Contact</label>
                <div className="flex items-center">
                  <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900 font-medium">{student.motherPhone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Guardian's Contact</label>
                <div className="flex items-center">
                  <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900 font-medium">{student.guardianPhone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Student's Email</label>
                <div className="flex items-center">
                  <FiMail className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900 font-medium">{student.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Timeline Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
              <FiDollarSign className="h-5 w-5 mr-2 text-green-600" />
              Fee Payment Timeline
            </h3>
            <FeeTimeline 
              timeline={feeTimeline} 
              loading={timelineLoading} 
              studentId={Number(id)}
              onRefresh={handleFeeTimelineRefresh}
              student={{
                firstName: student.firstName,
                lastName: student.lastName,
                admissionNumber: student.admissionNumber,
                rollNumber: student.rollNumber,
                className: student.class.name,
                sectionName: student.section.name,
                schoolId: student.schoolId,
                fatherName: student.fatherName,
              }}
              school={school}
            />
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
              <FiMapPin className="h-5 w-5 mr-2 text-red-600" />
              Address Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <div className="flex items-start">
                    <FiHome className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <p className="text-sm text-gray-900 font-medium">{student.address}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">City, State - Pincode</label>
                  <p className="text-sm text-gray-900 font-medium">
                    {student.city}, {student.state} - {student.pincode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
              <FiUserCheck className="h-5 w-5 mr-2 text-purple-600" />
              Parent/Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3">Father</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-blue-600">Name</label>
                        <p className="text-sm text-gray-900 font-medium">{student.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-600">Occupation</label>
                        <div className="flex items-center">
                          <FiBriefcase className="h-3 w-3 text-blue-400 mr-1" />
                          <p className="text-sm text-gray-900">{student.fatherOccupation || 'N/A'}</p>
                        </div>
                      </div>
                      {student.fatherAadharNumber && (
                        <div>
                          <label className="block text-xs font-medium text-blue-600">Aadhar Number</label>
                          <p className="text-sm text-gray-900">{student.fatherAadharNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {student.fatherPhoto && (
                    <div className="flex-shrink-0">
                      <img
                        src={student.fatherPhoto}
                        alt="Father"
                        className="w-40 h-40 rounded-lg object-cover border-2 border-white shadow"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-pink-800 mb-3">Mother</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-pink-600">Name</label>
                        <p className="text-sm text-gray-900 font-medium">{student.motherName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-pink-600">Occupation</label>
                        <div className="flex items-center">
                          <FiBriefcase className="h-3 w-3 text-pink-400 mr-1" />
                          <p className="text-sm text-gray-900">{student.motherOccupation || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {student.motherPhoto && (
                    <div className="flex-shrink-0">
                      <img
                        src={student.motherPhoto}
                        alt="Mother"
                        className="w-40 h-40 rounded-lg object-cover border-2 border-white shadow"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-green-800 mb-3">Guardian</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-green-600">Name</label>
                        <p className="text-sm text-gray-900 font-medium">{student.guardianName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-green-600">Relation</label>
                        <p className="text-sm text-gray-900">{student.guardianRelation || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  {student.guardianPhoto && (
                    <div className="flex-shrink-0">
                      <img
                        src={student.guardianPhoto}
                        alt="Guardian"
                        className="w-40 h-40 rounded-lg object-cover border-2 border-white shadow"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
              <FiBookOpen className="h-5 w-5 mr-2 text-indigo-600" />
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Admission Date</label>
                <div className="flex items-center">
                  <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{formatDateOnly(student.createdAt)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Previous School</label>
                <p className="text-sm text-gray-900 font-medium">N/A</p>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
              <FiClock className="h-5 w-5 mr-2 text-gray-600" />
              System Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                <div className="flex items-center">
                  <FiClock className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{formatDateOnly(student.createdAt)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <div className="flex items-center">
                  <FiClock className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{formatDateOnly(student.updatedAt)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                <div className="flex items-center">
                  <FiUserCheck className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{getCreator(student)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Student Modal */}
      {student && (
        <EditStudentModal
          student={student}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            refetch();
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* Admission Form Modal */}
      {student && school && (
        <AdmissionFormModal
          isOpen={isAdmissionFormOpen}
          onClose={() => setIsAdmissionFormOpen(false)}
          student={student}
          school={school}
        />
      )}
    </div>
  );
};

export default ViewStudentProfile;
