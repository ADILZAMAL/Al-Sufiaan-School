import { useState, useEffect } from 'react';
import { getStudentCalendar, type StudentAttendanceCalendar, type AttendanceCalendarRecord } from '../api';

interface AttendanceCalendarProps {
  studentId: number;
  studentActive?: boolean;
  hostel?: boolean;
  dayboarding?: boolean;
}

type AttendanceType = 'CLASS' | 'HOSTEL' | 'DAYBOARDING';

interface DayRecords {
  class?: AttendanceCalendarRecord;
  hostel?: AttendanceCalendarRecord;
  dayboarding?: AttendanceCalendarRecord;
  holiday?: AttendanceCalendarRecord;
}

export default function AttendanceCalendar({
  studentId,
  studentActive = true,
  hostel = false,
  dayboarding = false,
}: AttendanceCalendarProps) {
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

  // Group all records by date
  const recordsByDate = new Map<string, DayRecords>();
  if (calendar) {
    calendar.attendanceRecords.forEach((r) => {
      const existing = recordsByDate.get(r.date) || {};
      if (r.status === 'HOLIDAY') {
        existing.holiday = r;
      } else if (r.attendanceType === 'CLASS') {
        existing.class = r;
      } else if (r.attendanceType === 'HOSTEL') {
        existing.hostel = r;
      } else if (r.attendanceType === 'DAYBOARDING') {
        existing.dayboarding = r;
      }
      recordsByDate.set(r.date, existing);
    });
  }

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const formatDate = (day: number): string => {
    const month = String(selectedMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${selectedYear}-${month}-${dayStr}`;
  };

  const isSunday = (year: number, month: number, day: number) =>
    new Date(year, month, day).getDay() === 0;

  const getRecordsForDay = (day: number): DayRecords => {
    const dateStr = formatDate(day);
    const records = recordsByDate.get(dateStr) || {};
    if (!records.holiday && isSunday(selectedYear, selectedMonth, day)) {
      records.holiday = { date: dateStr, status: 'HOLIDAY', name: 'Sunday', reason: 'Weekly holiday' };
    }
    return records;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
      else setSelectedMonth(m => m - 1);
    } else {
      if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
      else setSelectedMonth(m => m + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const statusBadge = (record: AttendanceCalendarRecord | undefined, label: string) => {
    if (!record) {
      return (
        <div className="flex items-center gap-1">
          <span className="text-gray-300 text-[9px] font-medium">{label}</span>
          <span className="text-gray-300 text-[9px]">—</span>
        </div>
      );
    }
    const isPresent = record.status === 'PRESENT';
    const color = isPresent ? 'text-green-600' : 'text-red-500';
    const mark = isPresent ? '✓' : '✗';
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-400 text-[9px] font-medium">{label}</span>
        <span className={`text-[10px] font-bold ${color}`}>{mark}</span>
      </div>
    );
  };

  const dayCellBg = (records: DayRecords): string => {
    if (records.holiday) return 'bg-gray-100 border-gray-300';
    if (records.class?.status === 'PRESENT') return 'bg-green-100 border-green-400';
    if (records.class?.status === 'ABSENT') return 'bg-red-100 border-red-400';
    return 'bg-white border-gray-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
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

  const showBoarding = hostel || dayboarding;
  const boardingLabel = hostel ? 'Hostel' : 'Dayboard';
  const boardingType: AttendanceType | null = hostel ? 'HOSTEL' : dayboarding ? 'DAYBOARDING' : null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Attendance Calendar</h2>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigateMonth('prev')} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
          ← Previous
        </button>
        <h3 className="text-lg font-semibold">{monthNames[selectedMonth]} {selectedYear}</h3>
        <button onClick={() => navigateMonth('next')} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
          Next →
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-2 bg-gray-100 rounded">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: getFirstDayOfMonth(selectedYear, selectedMonth) }).map((_, i) => (
          <div key={`e-${i}`} className="h-20" />
        ))}

        {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }).map((_, index) => {
          const day = index + 1;
          const records = getRecordsForDay(day);
          const isHoliday = !!records.holiday;

          return (
            <div
              key={day}
              className={`h-20 border rounded-lg p-1 ${dayCellBg(records)}`}
              title={
                isHoliday
                  ? records.holiday?.name || 'Holiday'
                  : [
                      records.class ? `Class: ${records.class.status}` : '',
                      records.hostel ? `Hostel: ${records.hostel.status}` : '',
                      records.dayboarding ? `Dayboarding: ${records.dayboarding.status}` : '',
                    ].filter(Boolean).join(' | ')
              }
            >
              <div className="text-xs font-semibold text-gray-700 mb-0.5">{day}</div>

              {isHoliday ? (
                <div className="text-[9px] text-gray-400 leading-tight">
                  {records.holiday?.name || 'Holiday'}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {statusBadge(records.class, 'Cls')}
                  {showBoarding && boardingType && statusBadge(
                    boardingType === 'HOSTEL' ? records.hostel : records.dayboarding,
                    hostel ? 'Hst' : 'Day'
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-100 border border-green-400 rounded" />
          <span>Class Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-100 border border-red-400 rounded" />
          <span>Class Absent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded" />
          <span>Holiday</span>
        </div>
        {showBoarding && (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-green-600">✓</span>
            <span>/</span>
            <span className="font-bold text-red-500">✗</span>
            <span>{boardingLabel} attendance shown per cell</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {calendar && (
        <div className="mt-6 space-y-3">
          {/* Class summary */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">📋 Class Attendance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Present</p>
                <p className="font-bold text-green-600">{calendar.summary.class.totalPresent}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Absent</p>
                <p className="font-bold text-red-500">{calendar.summary.class.totalAbsent}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Working Days</p>
                <p className="font-bold text-gray-700">{calendar.summary.class.totalWorkingDays}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Attendance %</p>
                <p className="font-bold text-blue-600">{calendar.summary.class.attendancePercentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Hostel summary */}
          {calendar.summary.hostel && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">🏠 Hostel Attendance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Present</p>
                  <p className="font-bold text-green-600">{calendar.summary.hostel.totalPresent}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Absent</p>
                  <p className="font-bold text-red-500">{calendar.summary.hostel.totalAbsent}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Working Days</p>
                  <p className="font-bold text-gray-700">{calendar.summary.hostel.totalWorkingDays}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Attendance %</p>
                  <p className="font-bold text-purple-600">{calendar.summary.hostel.attendancePercentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Dayboarding summary */}
          {calendar.summary.dayboarding && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <h3 className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2">🌤️ Dayboarding Attendance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Present</p>
                  <p className="font-bold text-green-600">{calendar.summary.dayboarding.totalPresent}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Absent</p>
                  <p className="font-bold text-red-500">{calendar.summary.dayboarding.totalAbsent}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Working Days</p>
                  <p className="font-bold text-gray-700">{calendar.summary.dayboarding.totalWorkingDays}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Attendance %</p>
                  <p className="font-bold text-orange-600">{calendar.summary.dayboarding.attendancePercentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">Holidays (incl. Sundays): {calendar.summary.totalHolidays}</p>
        </div>
      )}
    </div>
  );
}
