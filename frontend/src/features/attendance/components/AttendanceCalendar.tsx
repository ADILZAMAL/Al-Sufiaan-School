import { useState, useEffect } from 'react';
import { getStudentCalendar, type StudentAttendanceCalendar, type AttendanceCalendarRecord } from '../api';

interface AttendanceCalendarProps {
  studentId: number;
  studentActive?: boolean;
}

export default function AttendanceCalendar({ studentId, studentActive = true }: AttendanceCalendarProps) {
  const [calendar, setCalendar] = useState<StudentAttendanceCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchCalendar();
  }, [studentId]);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const data = await getStudentCalendar(studentId);
      setCalendar(data);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HOLIDAY':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-white text-gray-400 border-gray-200';
    }
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (day: number): string => {
    // Format manually to avoid timezone conversion issues
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0'); // Months are 0-indexed
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const isSunday = (year: number, month: number, day: number): boolean => {
    const date = new Date(year, month, day);
    return date.getDay() === 0; // 0 = Sunday
  };

  const getRecordForDate = (dateStr: string, day?: number): AttendanceCalendarRecord | null => {
    if (!calendar) {
      // If no calendar data yet, check if it's a Sunday
      if (day !== undefined && isSunday(selectedYear, selectedMonth, day)) {
        return {
          date: dateStr,
          status: 'HOLIDAY',
          name: 'Sunday',
          reason: 'Weekly holiday',
        };
      }
      return null;
    }
    
    const record = calendar.attendanceRecords.find(r => r.date === dateStr);
    if (record) return record;
    
    // If no record found, check if it's a Sunday
    if (day !== undefined && isSunday(selectedYear, selectedMonth, day)) {
      return {
        date: dateStr,
        status: 'HOLIDAY',
        name: 'Sunday',
        reason: 'Weekly holiday',
      };
    }
    
    return null;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!studentActive) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Attendance Calendar</h2>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Student has left school</p>
          <p className="text-sm text-gray-500 mt-2">Attendance tracking is disabled for students who have left school.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Attendance Calendar</h2>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
        >
          ← Previous
        </button>
        <h3 className="text-lg font-semibold">
          {monthNames[selectedMonth]} {selectedYear}
        </h3>
        <button
          onClick={() => navigateMonth('next')}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-medium text-gray-600 py-2 bg-gray-100 rounded">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: getFirstDayOfMonth(selectedYear, selectedMonth) }).map((_, index) => (
          <div key={`empty-${index}`} className="h-20"></div>
        ))}

        {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }).map((_, index) => {
          const day = index + 1;
          const dateStr = formatDate(day);
          const record = getRecordForDate(dateStr, day);

          return (
            <div
              key={day}
              className={`h-20 border rounded-lg p-1 ${getStatusColor(record?.status || '')} cursor-pointer hover:opacity-80`}
              title={record ? `${record.status}${record.name ? ` (${record.name})` : ''}` : 'No record'}
            >
              <div className="text-sm font-semibold">{day}</div>
              {record && record.status !== 'HOLIDAY' && (
                <div className="text-xs mt-1">
                  {record.status === 'PRESENT' ? '✓' : '✗'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
          <span>Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
          <span>Absent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
          <span>Holiday</span>
        </div>
      </div>

      {/* Summary */}
      {calendar && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Summary (All Time)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Present:</p>
              <p className="font-semibold text-green-600">{calendar.summary.totalPresent}</p>
            </div>
            <div>
              <p className="text-gray-600">Absent:</p>
              <p className="font-semibold text-red-600">{calendar.summary.totalAbsent}</p>
            </div>
            <div>
              <p className="text-gray-600">Working Days:</p>
              <p className="font-semibold text-blue-600">{calendar.summary.totalWorkingDays}</p>
            </div>
            <div>
              <p className="text-gray-600">Attendance %:</p>
              <p className="font-semibold text-blue-600">{calendar.summary.attendancePercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
