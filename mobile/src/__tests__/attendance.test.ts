import dayjs from 'dayjs';
import { ATTENDANCE_EDIT_WINDOW_DAYS, attendanceTone, editableAttendanceDates, isEditableAttendanceDate } from '../lib/attendance';
import { todayISO } from '../lib/date';
import { eachHolidayDate } from '../lib/holidays';

describe('attendance edit window', () => {
  const today = todayISO();
  const daysAgo = (n: number) => dayjs(today).subtract(n, 'day').format('YYYY-MM-DD');

  it('allows today and the previous 7 days only', () => {
    expect(isEditableAttendanceDate(today)).toBe(true);
    expect(isEditableAttendanceDate(daysAgo(ATTENDANCE_EDIT_WINDOW_DAYS))).toBe(true);
    expect(isEditableAttendanceDate(daysAgo(ATTENDANCE_EDIT_WINDOW_DAYS + 1))).toBe(false);
    expect(isEditableAttendanceDate(dayjs(today).add(1, 'day').format('YYYY-MM-DD'))).toBe(false);
  });

  it('offers exactly the editable dates, newest first', () => {
    const dates = editableAttendanceDates();
    expect(dates).toHaveLength(ATTENDANCE_EDIT_WINDOW_DAYS + 1);
    expect(dates[0]).toBe(today);
    expect(dates.every(isEditableAttendanceDate)).toBe(true);
  });

  it('bands attendance percentages', () => {
    expect(attendanceTone(95)).toBe('success');
    expect(attendanceTone(80)).toBe('warning');
    expect(attendanceTone(50)).toBe('danger');
    expect(attendanceTone(null)).toBe('neutral');
  });
});

describe('eachHolidayDate', () => {
  it('lists every covered date across a month boundary', () => {
    expect(eachHolidayDate({ startDate: '2026-09-30', endDate: '2026-10-02' })).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
  });
});
