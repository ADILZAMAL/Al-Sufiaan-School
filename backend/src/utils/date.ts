/**
 * Date-only helpers. All values are `YYYY-MM-DD` strings in the school's
 * timezone — never `Date` objects — so DATEONLY columns are not shifted by the
 * server clock (Render runs in UTC, the school is in IST).
 */

export const SCHOOL_TZ = process.env.SCHOOL_TZ || 'Asia/Kolkata';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const toUTC = (date: string) => new Date(`${date}T00:00:00Z`);

export const isISODate = (value: unknown): value is string =>
  typeof value === 'string' &&
  ISO_DATE.test(value) &&
  !Number.isNaN(toUTC(value).getTime()) &&
  toUTC(value).toISOString().slice(0, 10) === value;

/** Today's date in the school's timezone. */
export const todayISO = (): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SCHOOL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
};

export const addDaysISO = (date: string, days: number): string => {
  const d = toUTC(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** 0 = Sunday … 6 = Saturday */
export const dayOfWeekISO = (date: string): number => toUTC(date).getUTCDay();

/** Whole days from `from` to `to` (positive when `to` is later). */
export const diffDaysISO = (from: string, to: string): number =>
  Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / DAY_MS);

/** Every date from `from` to `to`, inclusive. */
export const eachDateISO = (from: string, to: string): string[] => {
  const dates: string[] = [];
  for (let d = from; d <= to; d = addDaysISO(d, 1)) dates.push(d);
  return dates;
};
