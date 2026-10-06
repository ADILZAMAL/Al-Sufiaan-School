/**
 * Report-card grading shared by web and mobile (moved from the web
 * ReportCardPage so both show identical numbers).
 */

export const GRADE_SCALE = [
  { grade: 'A1', min: 91 },
  { grade: 'A2', min: 81 },
  { grade: 'B1', min: 71 },
  { grade: 'B2', min: 61 },
  { grade: 'C1', min: 51 },
  { grade: 'C2', min: 41 },
  { grade: 'D', min: 33 },
  { grade: 'E', min: 0 },
] as const;

/** CBSE-style letter grade from an (unrounded) percentage. */
export const gradeFor = (percentage: number): string => GRADE_SCALE.find(g => percentage >= g.min)!.grade;

interface SubjectMarks {
  totalMarks: number;
  passingMarks: number;
  marks: { studentId: number; marksObtained: number | null; isAbsent: boolean }[];
}

export interface StudentSummary {
  studentId: number;
  obtained: number;
  maxTotal: number;
  /** Subjects with a mark (absent / blank are not counted). */
  attempted: number;
  /** Unrounded; null when no subject was attempted. */
  percentage: number | null;
  grade: string | null;
  /** By total obtained, ties share a rank; null when nothing attempted. */
  rank: number | null;
  /** Number of ranked students. */
  rankOf: number;
  failedSubjects: number;
}

/**
 * Totals, percentage, grade and rank for each student over an exam event.
 * Only attempted subjects count toward the total and maximum.
 */
export const computeEventSummaries = (studentIds: number[], subjects: SubjectMarks[]): StudentSummary[] => {
  const rows = studentIds.map(studentId => {
    let obtained = 0;
    let maxTotal = 0;
    let attempted = 0;
    let failedSubjects = 0;
    for (const subject of subjects) {
      const mark = subject.marks.find(m => m.studentId === studentId);
      if (!mark || mark.isAbsent || mark.marksObtained === null) continue;
      obtained += mark.marksObtained;
      maxTotal += subject.totalMarks;
      attempted += 1;
      if (mark.marksObtained < subject.passingMarks) failedSubjects += 1;
    }
    return { studentId, obtained, maxTotal, attempted, failedSubjects };
  });

  const ranked = rows.filter(r => r.attempted > 0).sort((a, b) => b.obtained - a.obtained);
  const rankById = new Map<number, number>();
  ranked.forEach((r, i) => {
    const rank = i > 0 && r.obtained === ranked[i - 1].obtained ? rankById.get(ranked[i - 1].studentId)! : i + 1;
    rankById.set(r.studentId, rank);
  });

  return rows.map(r => {
    const percentage = r.maxTotal > 0 ? (r.obtained / r.maxTotal) * 100 : null;
    return {
      ...r,
      percentage,
      grade: percentage === null ? null : gradeFor(percentage),
      rank: rankById.get(r.studentId) ?? null,
      rankOf: ranked.length,
    };
  });
};
