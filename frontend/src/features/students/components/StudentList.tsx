import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiMail } from 'react-icons/fi';
import { Student, Gender } from '../types';

interface StudentListProps {
  students: Student[];
  loading?: boolean;
}

const StudentList: React.FC<StudentListProps> = ({ 
  students, 
  loading = false
}) => {
  const navigate = useNavigate();

  const handleView = (student: Student) => {
    navigate(`/dashboard/students/${student.id}`);
  };

  const getFullName = (student: Student) => {
    return `${student.firstName} ${student.lastName}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <FiUser className="h-3 w-3 text-gray-500" />
                    <span>Admission No</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Father's Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <FiPhone className="h-3 w-3 text-gray-500" />
                    <span>Contact</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Due
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="bg-gray-100 rounded-full p-4">
                        <FiUser className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium text-gray-900">No students found</h3>
                        <p className="text-sm text-gray-500">Get started by adding your first student</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr 
                    key={student.id} 
                    onClick={() => handleView(student)}
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-150 border-b border-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">{index + 1}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{student.admissionNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getFullName(student)}</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <FiMail className="h-3 w-3 mr-1" />
                          {student.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900 font-medium">{student.fatherName}</p>
                      <p className="text-xs text-gray-500 mt-1">Father</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                          {student.class.name}-A
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.gender === Gender.MALE 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : student.gender === Gender.FEMALE
                            ? 'bg-pink-100 text-pink-800 border border-pink-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          {student.gender === Gender.MALE ? '👨' : student.gender === Gender.FEMALE ? '👩' : '👤'} {student.gender}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{student.phone}</div>
                      <p className="text-xs text-gray-500 mt-1">Mobile</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end">
                        {(student.totalDue || 0) > 0 ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            student.totalDue! > 1000 
                              ? 'bg-red-100 text-red-800 border border-red-200' 
                              : student.totalDue! > 0 
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : 'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            ₹{student.totalDue?.toLocaleString('en-IN') || 0}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                            ₹0
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default StudentList;
