/** Roll numbers are strings; sort numerically when possible, blanks last. */
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

export const sortByRoll = <T extends { rollNumber?: string | null; firstName: string; lastName?: string | null }>(items: T[]) =>
  [...items].sort(
    (a, b) =>
      compareRollNumbers(a.rollNumber, b.rollNumber) ||
      `${a.firstName} ${a.lastName ?? ''}`.localeCompare(`${b.firstName} ${b.lastName ?? ''}`)
  );

export const fullName = (s: { firstName: string; lastName?: string | null }) =>
  `${s.firstName} ${s.lastName ?? ''}`.trim();

export const initials = (s: { firstName: string; lastName?: string | null }) =>
  `${s.firstName.charAt(0)}${s.lastName?.charAt(0) ?? ''}`.toUpperCase();
