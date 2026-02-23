import { useCallback, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getAllAttendanceStats } from '../api';
import { useAppContext } from '../../../providers/AppContext';
import SessionSelector from '../../sessions/components/SessionSelector';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';

export default function AttendanceDashboard() {
  const { showToast } = useAppContext();
  const [classStatsList, setClassStatsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // Fetch active session on mount to set default
  useQuery<AcademicSession | null>(
    'activeSession',
    academicSessionApi.getActiveSession,
    {
      staleTime: 5 * 60 * 1000,
      onSuccess: (session) => {
        if (session && selectedSessionId === null) {
          setSelectedSessionId(session.id);
        }
      },
    }
  );

  const fetchStats = useCallback(async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const params: { date: string; sessionId?: number } = { date: selectedDate };
      if (selectedSessionId) params.sessionId = selectedSessionId;

      const data = await getAllAttendanceStats(params);

      setIsHoliday(data.isHoliday);
      setHolidayName(data.holidayName);
      setClassStatsList(data.classStats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      showToast({ message: error.message || 'Failed to load attendance stats', type: 'ERROR' });
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedSessionId, showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Attendance Dashboard</h1>
        <SessionSelector
          value={selectedSessionId}
          onChange={(id) => setSelectedSessionId(id)}
        />
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Holiday Alert */}
      {isHoliday && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Holiday:</strong> {holidayName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 rounded-lg p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Present</p>
                <p className="text-2xl font-semibold text-gray-900">{classStatsList.reduce((sum, item) => sum + item.presentCount, 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Absent</p>
                <p className="text-2xl font-semibold text-gray-900">{classStatsList.reduce((sum, item) => sum + item.absentCount, 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Attendance %</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(() => {
                    const totalStudents = classStatsList.reduce((sum, item) => sum + item.totalStudents, 0);
                    const totalPresent = classStatsList.reduce((sum, item) => sum + item.presentCount, 0);
                    return totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : '0';
                  })()}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class/Section Wise Stats Table */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Class-Wise Attendance
          {loading && <span className="ml-2 text-sm font-normal text-gray-500">(Loading...)</span>}
        </h2>
        {classStatsList.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No class/section data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Not Marked</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classStatsList.map((item) => (
                  <tr key={`${item.classId}-${item.sectionId}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.className}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sectionName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">{item.presentCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">{item.absentCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">{item.notMarked}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalStudents}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center">
                        <span className="mr-2">{item.attendancePercentage ? item.attendancePercentage.toFixed(1) : '0'}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.attendancePercentage >= 75 ? 'bg-green-500' : item.attendancePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${item.attendancePercentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
