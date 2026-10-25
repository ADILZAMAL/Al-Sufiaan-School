import { MarksRosterRow } from '../../types';
import { fullName } from '../../lib/rollNumber';

/** Editable state of one student's mark. `value` is the raw text input. */
export interface MarkEntry {
  value: string;
  absent: boolean;
}

export interface MarkStudent {
  studentId: number;
  name: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  photo: string | null;
}

export const rosterToStudents = (rows: MarksRosterRow[]): MarkStudent[] =>
  rows.map(r => ({
    studentId: r.studentId,
    name: fullName(r.student),
    firstName: r.student.firstName,
    lastName: r.student.lastName,
    rollNumber: r.student.enrollments?.[0]?.rollNumber ?? null,
    photo: r.student.studentPhoto ?? null,
  }));

const formatMark = (n: number) => String(Number.isInteger(n) ? n : Number(n.toFixed(2)));

export const rosterToEntries = (rows: MarksRosterRow[]): Record<number, MarkEntry> =>
  Object.fromEntries(
    rows.map(r => [
      r.studentId,
      {
        absent: r.isAbsent,
        value: !r.isAbsent && r.marksObtained !== null && r.marksObtained !== '' ? formatMark(Number(r.marksObtained)) : '',
      },
    ])
  );

/** null = blank (not entered). Throws nothing; returns NaN for garbage. */
export const parseMark = (value: string): number | null => {
  const trimmed = value.trim().replace(',', '.');
  if (trimmed === '') return null;
  return /^\d+(\.\d{1,2})?$/.test(trimmed) ? Number(trimmed) : NaN;
};

/** Error text for a mark, or null when valid/blank. */
export const markError = (entry: MarkEntry | undefined, totalMarks: number): string | null => {
  if (!entry || entry.absent) return null;
  const n = parseMark(entry.value);
  if (n === null) return null;
  if (Number.isNaN(n)) return 'Numbers only (max 2 decimals)';
  if (n > totalMarks) return `Max ${totalMarks}`;
  return null;
};

export const sameEntry = (a: MarkEntry | undefined, b: MarkEntry | undefined) =>
  (a?.absent ?? false) === (b?.absent ?? false) &&
  (parseMark(a?.value ?? '') ?? '') === (parseMark(b?.value ?? '') ?? '');

export interface MarksStats {
  total: number;
  entered: number;
  absent: number;
  notEntered: number;
  passed: number;
  failed: number;
  average: number | null;
  highest: number | null;
  lowest: number | null;
}

export const computeStats = (
  students: MarkStudent[],
  entries: Record<number, MarkEntry>,
  passingMarks: number
): MarksStats => {
  const scores: number[] = [];
  let absent = 0;
  for (const s of students) {
    const e = entries[s.studentId];
    if (e?.absent) {
      absent++;
      continue;
    }
    const n = parseMark(e?.value ?? '');
    if (n !== null && !Number.isNaN(n)) scores.push(n);
  }
  const passed = scores.filter(n => n >= passingMarks).length;
  return {
    total: students.length,
    entered: scores.length + absent,
    absent,
    notEntered: students.length - scores.length - absent,
    passed,
    failed: scores.length - passed,
    average: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
    highest: scores.length ? Math.max(...scores) : null,
    lowest: scores.length ? Math.min(...scores) : null,
  };
};

export interface RankedRow {
  student: MarkStudent;
  marks: number | null;
  absent: boolean;
  /** Tied marks share a rank; null for absent / not entered. */
  rank: number | null;
  percentage: number | null;
  passed: boolean | null;
}

/** Highest marks first; absent and blank at the end. */
export const rankStudents = (
  students: MarkStudent[],
  entries: Record<number, MarkEntry>,
  totalMarks: number,
  passingMarks: number
): RankedRow[] => {
  const rows = students.map(student => {
    const e = entries[student.studentId];
    const n = e && !e.absent ? parseMark(e.value) : null;
    const marks = n === null || Number.isNaN(n) ? null : n;
    return {
      student,
      marks,
      absent: !!e?.absent,
      rank: null as number | null,
      percentage: marks === null ? null : Math.round((marks / totalMarks) * 1000) / 10,
      passed: marks === null ? null : marks >= passingMarks,
    };
  });
  const scored = rows.filter(r => r.marks !== null).sort((a, b) => b.marks! - a.marks!);
  scored.forEach((row, i) => {
    row.rank = i > 0 && scored[i - 1].marks === row.marks ? scored[i - 1].rank : i + 1;
  });
  const rest = rows.filter(r => r.marks === null).sort((a, b) => Number(b.absent) - Number(a.absent));
  return [...scored, ...rest];
};

/** Score bands for the results distribution bar. */
export const DISTRIBUTION_BANDS = [
  { label: '90–100%', min: 90 },
  { label: '75–89%', min: 75 },
  { label: '50–74%', min: 50 },
  { label: '33–49%', min: 33 },
  { label: '<33%', min: 0 },
];
