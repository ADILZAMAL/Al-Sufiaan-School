import React from 'react';
import { FiX, FiUser, FiPhone, FiCalendar, FiBookOpen, FiMapPin, FiMail, FiHome, FiBriefcase, FiUserCheck, FiClock } from 'react-icons/fi';
import { Student } from '../types';

const formatDateOnly = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

interface ViewStudentModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

const getClassName = (student: Student) => {
  return `${student.class.name} - ${student.section.name}`;
}

const getCreator = (student: Student) => {
  if (!student.creator) return 'N/A';
  return `${student.creator.firstName} ${student.creator.lastName}`;
}

const ViewStudentModal: React.FC<ViewStudentModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-auto shadow-2xl transform transition-all animate-slide-up">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Student Profile</h2>
              <p className="text-blue-100 text-sm">Complete student information and details</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-all duration-200 hover:rotate-90 transform p-2 rounded-full hover:bg-white/10"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b border-blue-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
            </div>
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
                Blood Group: <span className="font-medium">{student.bloodGroup || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
              <FiUser className="h-5 w-5 mr-2 text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <div className="flex items-center">
                  <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900 font-medium">{student.firstName} {student.lastName}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Admission Number</label>
                <p className="text-sm text-gray-900 font-semibold bg-blue-50 px-3 py-2 rounded-lg">{student.admissionNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Roll Number</label>
                <p className="text-sm text-gray-900 font-semibold bg-purple-50 px-3 py-2 rounded-lg">{student.rollNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Class & Section</label>
                <p className="text-sm text-gray-900 font-semibold bg-green-50 px-3 py-2 rounded-lg">{getClassName(student)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                <p className="text-sm text-gray-900 font-medium">{student.gender}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                <div className="flex items-center">
                  <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{formatDateOnly(student.dateOfBirth)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Blood Group</label>
                <p className="text-sm text-gray-900 font-medium">{student.bloodGroup || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Aadhaar Number</label>
                <p className="text-sm text-gray-900 font-medium">{student.aadhaarNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

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
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Father</h4>
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
                </div>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-pink-800 mb-2">Mother</h4>
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
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-green-800 mb-2">Guardian</h4>
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

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Last updated: {formatDateOnly(student.updatedAt)}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewStudentModal;
