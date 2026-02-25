import { useCallback, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getAllAttendanceStats } from '../api';
import { useAppContext } from '../../../providers/AppContext';
import SessionSelector from '../../sessions/components/SessionSelector';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';
import {
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaChartBar,
  FaCalendarAlt,
  FaExclamationTriangle,
} from 'react-icons/fa';

export default function AttendanceDashboard() {
  const { showToast } = useAppContext();
  const [classStatsList, setClassStatsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [manualSessionId, setManualSessionId] = useState<number | null>(null);

  const { data: activeSession } = useQuery<AcademicSession | null>(
    'activeSession',
    academicSessionApi.getActiveSession,
    { staleTime: 5 * 60 * 1000 }
  );

  const selectedSessionId = manualSessionId ?? activeSession?.id ?? null;

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

  const totalPresent = classStatsList.reduce((sum, item) => sum + item.presentCount, 0);
  const totalAbsent = classStatsList.reduce((sum, item) => sum + item.absentCount, 0);
  const totalStudents = classStatsList.reduce((sum, item) => sum + item.totalStudents, 0);
  const totalNotMarked = classStatsList.reduce((sum, item) => sum + item.notMarked, 0);
  const overallPct = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : '0';

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track daily attendance across all classes</p>
          </div>
          <SessionSelector
            value={selectedSessionId}
            onChange={(id) => setManualSessionId(id)}
          />
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

        {/* Holiday Alert */}
        {isHoliday && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <FaExclamationTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Holiday</p>
              <p className="text-sm text-amber-700">{holidayName}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: totalPresent, Icon: FaCheckCircle, colorCls: 'bg-emerald-50 text-emerald-600' },
            { label: 'Absent', value: totalAbsent, Icon: FaTimesCircle, colorCls: 'bg-red-50 text-red-600' },
            { label: 'Not Marked', value: totalNotMarked, Icon: FaExclamationTriangle, colorCls: 'bg-amber-50 text-amber-600' },
            { label: 'Overall %', value: `${overallPct}%`, Icon: FaChartBar, colorCls: 'bg-blue-50 text-blue-600' },
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

        {/* Class-wise Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <FaUsers className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Class-wise Attendance</h2>
              {loading && <p className="text-xs text-gray-400">Loading…</p>}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : classStatsList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaUsers className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">No attendance data</p>
              <p className="text-sm text-gray-400 mt-1">No records found for the selected date and session.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class / Section</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Present</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Absent</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Not Marked</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classStatsList.map((item) => {
                    const pct = item.attendancePercentage || 0;
                    const pctStr = pct.toFixed(1);
                    const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
                    const pctTextColor = pct >= 75 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-red-700';

                    return (
                      <tr key={`${item.classId}-${item.sectionId}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{item.className}</span>
                            {item.sectionName && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                {item.sectionName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {item.presentCount}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            {item.absentCount}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            {item.notMarked}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm text-gray-500 font-medium">
                          {item.totalStudents}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3 min-w-[120px]">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${barColor}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold w-11 text-right ${pctTextColor}`}>
                              {pctStr}%
                            </span>
                          </div>
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
