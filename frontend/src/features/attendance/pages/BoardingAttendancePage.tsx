import { useCallback, useEffect, useState } from 'react';
import { getBoardingAttendance, BoardingStudentWithAttendance } from '../api';
import { useAppContext } from '../../../providers/AppContext';
import {
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt,
  FaExclamationTriangle,
} from 'react-icons/fa';

type BoardingType = 'HOSTEL' | 'DAYBOARDING';

export default function BoardingAttendancePage() {
  const { showToast } = useAppContext();
  const [boardingType, setBoardingType] = useState<BoardingType>('HOSTEL');
  const [students, setStudents] = useState<BoardingStudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const fetchStudents = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const data = await getBoardingAttendance({ boardingType, date: selectedDate });
      setStudents(data);
    } catch (error: any) {
      console.error('Error fetching boarding attendance:', error);
      showToast({ message: error.message || 'Failed to load boarding attendance', type: 'ERROR' });
    } finally {
      setLoading(false);
    }
  }, [boardingType, selectedDate, showToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const presentCount = students.filter((s) => s.attendance?.status === 'PRESENT').length;
  const absentCount = students.filter((s) => s.attendance?.status === 'ABSENT').length;
  const notMarked = students.length - presentCount - absentCount;

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boarding Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">View hostel and dayboarding students attendance</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['HOSTEL', 'DAYBOARDING'] as BoardingType[]).map((type) => (
            <button
              key={type}
              onClick={() => setBoardingType(type)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                boardingType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {type === 'HOSTEL' ? '🏠 Hostel' : '🌤️ Dayboarding'}
            </button>
          ))}
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <FaCalendarAlt className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Viewing</p>
              <p className="text-sm font-medium text-gray-800">{formattedDate}</p>
            </div>
          </div>
          <div className="sm:ml-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: presentCount, Icon: FaCheckCircle, colorCls: 'bg-emerald-50 text-emerald-600' },
            { label: 'Absent', value: absentCount, Icon: FaTimesCircle, colorCls: 'bg-red-50 text-red-600' },
            { label: 'Not Marked', value: notMarked, Icon: FaExclamationTriangle, colorCls: 'bg-amber-50 text-amber-600' },
            { label: 'Total', value: students.length, Icon: FaUsers, colorCls: 'bg-blue-50 text-blue-600' },
          ].map(({ label, value, Icon, colorCls }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorCls}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{loading ? '–' : value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <FaUsers className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {boardingType === 'HOSTEL' ? 'Hostel' : 'Dayboarding'} Students
              </h2>
              {loading && <p className="text-xs text-gray-400">Loading…</p>}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaUsers className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">No students found</p>
              <p className="text-sm text-gray-400 mt-1">
                No {boardingType === 'HOSTEL' ? 'hostel' : 'dayboarding'} students are registered.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class / Section</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => {
                    const status = student.attendance?.status;
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {student.class ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">{student.class.name}</span>
                              {student.section && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                  {student.section.name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                          {student.rollNumber || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {status === 'PRESENT' ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              Present
                            </span>
                          ) : status === 'ABSENT' ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              Absent
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                              Not Marked
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
