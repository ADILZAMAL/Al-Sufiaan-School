import { addDaysISO, dayOfWeekISO, diffDaysISO, eachDateISO, isISODate, todayISO } from '../date';

describe('date helpers', () => {
  afterEach(() => jest.useRealTimers());

  it('returns the IST date even when UTC is still on the previous day', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-26T21:00:00Z')); // 02:30 IST on the 27th
    expect(todayISO()).toBe('2026-09-27');
  });

  it('validates real calendar dates only', () => {
    expect(isISODate('2026-09-27')).toBe(true);
    expect(isISODate('2026-02-30')).toBe(false);
    expect(isISODate('27-09-2026')).toBe(false);
    expect(isISODate(undefined)).toBe(false);
  });

  it('does date arithmetic without timezone drift', () => {
    expect(addDaysISO('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
    expect(diffDaysISO('2026-09-01', '2026-09-30')).toBe(29);
    expect(dayOfWeekISO('2026-09-27')).toBe(0); // Sunday
    expect(eachDateISO('2026-09-29', '2026-10-01')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01']);
  });
});
