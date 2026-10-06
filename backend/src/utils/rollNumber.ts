/**
 * Roll numbers are stored as strings, so SQL `ORDER BY rollNumber` puts "10"
 * before "2". Sort in code instead: numeric when possible, blanks last.
 */
export const compareRollNumbers = (a: string | null | undefined, b: string | null | undefined): number => {
  const ra = a?.trim() || null;
  const rb = b?.trim() || null;
  if (ra == null && rb == null) return 0;
  if (ra == null) return 1;
  if (rb == null) return -1;
  const na = Number(ra);
  const nb = Number(rb);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return ra.localeCompare(rb, undefined, { numeric: true });
};

/** Roll-number order with name as the tie-breaker. */
export const byRollThenName = <T>(getRoll: (item: T) => string | null | undefined, getName: (item: T) => string) =>
  (a: T, b: T): number => compareRollNumbers(getRoll(a), getRoll(b)) || getName(a).localeCompare(getName(b));
