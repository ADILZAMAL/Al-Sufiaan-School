import { addDaysISO, todayISO } from './date';

/** Teachers can mark or correct attendance for today and this many days back (matches the backend). */
export const ATTENDANCE_EDIT_WINDOW_DAYS = 7;

export const isEditableAttendanceDate = (date: string) => {
  const today = todayISO();
  return date <= today && date >= addDaysISO(today, -ATTENDANCE_EDIT_WINDOW_DAYS);
};

/** Dates a teacher can pick, newest first: today … today − 7. */
export const editableAttendanceDates = () => {
  const today = todayISO();
  return Array.from({ length: ATTENDANCE_EDIT_WINDOW_DAYS + 1 }, (_, i) => addDaysISO(today, -i));
};

/** Colour band for an attendance percentage. */
export const attendanceTone = (percentage: number | null | undefined): 'success' | 'warning' | 'danger' | 'neutral' => {
  if (percentage == null) return 'neutral';
  if (percentage >= 90) return 'success';
  if (percentage >= 75) return 'warning';
  return 'danger';
};
