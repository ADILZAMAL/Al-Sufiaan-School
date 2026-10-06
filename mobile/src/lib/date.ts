import dayjs from 'dayjs';

/**
 * Dates are passed to the API as `YYYY-MM-DD` in the device's local timezone
 * (teachers' phones are on IST). Never use `toISOString()` for a date — it is
 * UTC and gives yesterday before 05:30 IST.
 */

export const ISO_DATE = 'YYYY-MM-DD';

export const todayISO = () => dayjs().format(ISO_DATE);

export const toISODate = (date: Date) => dayjs(date).format(ISO_DATE);

export const fromISODate = (iso: string) => dayjs(iso).toDate();

export const addDaysISO = (iso: string, days: number) => dayjs(iso).add(days, 'day').format(ISO_DATE);

export const isSundayISO = (iso: string) => dayjs(iso).day() === 0;

/** "27 Sep 2026" */
export const formatDate = (iso: string | null | undefined) => (iso ? dayjs(iso).format('D MMM YYYY') : '—');

/** "Sunday, 27 September" */
export const formatLongDate = (iso: string) => dayjs(iso).format('dddd, D MMMM');

/** "Today", "Yesterday", or "Fri, 25 Sep" */
export const formatRelativeDay = (iso: string) => {
  const today = todayISO();
  if (iso === today) return 'Today';
  if (iso === addDaysISO(today, -1)) return 'Yesterday';
  return dayjs(iso).format('ddd, D MMM');
};

export const greetingForNow = () => {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
