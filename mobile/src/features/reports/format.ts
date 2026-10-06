import { EventReportCard, EventReportSummary } from '../../types';

/** 1 → "1st", 2 → "2nd", 11 → "11th" */
export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

/** Report cards show one decimal, like the web. */
export const formatPct = (pct: number | null | undefined) => (pct == null ? '—' : `${pct.toFixed(1)}%`);

export const summaryFor = (report: EventReportCard, studentId: number): EventReportSummary | undefined =>
  report.summaries.find(s => s.studentId === studentId);

export const gradeTone = (grade: string | null | undefined): 'success' | 'primary' | 'warning' | 'danger' | 'neutral' => {
  if (!grade) return 'neutral';
  if (grade.startsWith('A')) return 'success';
  if (grade.startsWith('B')) return 'primary';
  if (grade.startsWith('C') || grade === 'D') return 'warning';
  return 'danger';
};
