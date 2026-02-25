import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import { Student, Gender } from '../types';

interface StudentListProps {
  students: Student[];
  loading?: boolean;
  selectedSessionId?: number | null;
}

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

const StudentList: React.FC<StudentListProps> = ({
  students,
  loading = false,
  selectedSessionId,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleView = (student: Student) => {
    const searchParams = location.search;
    navigate(`/dashboard/students/${student.id}${searchParams}`);
  };

  const getEnrollment = (student: Student) => {
    if (!student.enrollments || student.enrollments.length === 0) return null;
    if (selectedSessionId) {
      return student.enrollments.find(e => e.sessionId === selectedSessionId) || student.enrollments[0];
    }
    return student.enrollments[0];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-4 border-gray-100"></div>
          <div className="h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0"></div>
        </div>
        <p className="text-sm text-gray-500">Loading students...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <FiUser className="w-6 h-6 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">No students found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting filters or add a new student</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Father</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Class</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Gender</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {students.map((student) => {
            const enrollment = getEnrollment(student);
            const fullName = `${student.firstName} ${student.lastName}`;
            const avatarColor = getAvatarColor(student.firstName);
            const due = student.totalDue || 0;

            return (
              <tr
                key={student.id}
                onClick={() => handleView(student)}
                className="hover:bg-blue-50/50 transition-colors cursor-pointer"
              >
                {/* Student */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {student.studentPhoto ? (
                      <img
                        src={student.studentPhoto}
                        alt={fullName}
                        className="h-9 w-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarColor}`}>
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{fullName}</p>
                      <p className="text-xs text-gray-400">{student.admissionNumber}</p>
                    </div>
                  </div>
                </td>

                {/* Father */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <p className="text-sm text-gray-700">{student.fatherName}</p>
                </td>

                {/* Class / Section */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  {enrollment?.class?.name ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {enrollment.class.name}
                      {enrollment.section?.name ? `-${enrollment.section.name}` : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>

                {/* Gender */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                    student.gender === Gender.MALE
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : student.gender === Gender.FEMALE
                      ? 'bg-pink-50 text-pink-700 border border-pink-100'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {student.gender === Gender.MALE ? 'M' : student.gender === Gender.FEMALE ? 'F' : student.gender}
                  </span>
                </td>

                {/* Contact */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <p className="text-sm text-gray-700">{student.phone}</p>
                </td>

                {/* Due */}
                <td className="px-5 py-3.5 whitespace-nowrap text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    due > 1000
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : due > 0
                      ? 'bg-orange-50 text-orange-700 border border-orange-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    ₹{due.toLocaleString('en-IN')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList;
