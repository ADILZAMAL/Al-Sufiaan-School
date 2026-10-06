import { Holiday } from '../types';
import { addDaysISO } from './date';

/** Every date (YYYY-MM-DD) a holiday covers, inclusive. */
export const eachHolidayDate = (holiday: Pick<Holiday, 'startDate' | 'endDate'>): string[] => {
  const dates: string[] = [];
  const end = holiday.endDate.slice(0, 10);
  for (let d = holiday.startDate.slice(0, 10); d <= end && dates.length < 366; d = addDaysISO(d, 1)) dates.push(d);
  return dates;
};
