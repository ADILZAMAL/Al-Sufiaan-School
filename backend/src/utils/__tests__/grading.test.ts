import { computeEventSummaries, gradeFor } from '../grading';

describe('gradeFor', () => {
  it('uses CBSE bands with inclusive lower bounds', () => {
    expect(gradeFor(100)).toBe('A1');
    expect(gradeFor(91)).toBe('A1');
    expect(gradeFor(90.99)).toBe('A2');
    expect(gradeFor(81)).toBe('A2');
    expect(gradeFor(71)).toBe('B1');
    expect(gradeFor(61)).toBe('B2');
    expect(gradeFor(51)).toBe('C1');
    expect(gradeFor(41)).toBe('C2');
    expect(gradeFor(33)).toBe('D');
    expect(gradeFor(32.99)).toBe('E');
    expect(gradeFor(0)).toBe('E');
  });
});

describe('computeEventSummaries', () => {
  const subjects = [
    { totalMarks: 50, passingMarks: 17, marks: [
      { studentId: 1, marksObtained: 45, isAbsent: false },
      { studentId: 2, marksObtained: 40, isAbsent: false },
      { studentId: 3, marksObtained: 10, isAbsent: false },
      { studentId: 4, marksObtained: null, isAbsent: true },
    ] },
    { totalMarks: 50, passingMarks: 17, marks: [
      { studentId: 1, marksObtained: 40, isAbsent: false },
      { studentId: 2, marksObtained: 45, isAbsent: false },
      { studentId: 3, marksObtained: null, isAbsent: true },
      { studentId: 4, marksObtained: null, isAbsent: true },
    ] },
  ];

  const byId = (id: number) => computeEventSummaries([1, 2, 3, 4], subjects).find(s => s.studentId === id)!;

  it('shares ranks for tied totals', () => {
    expect(byId(1)).toMatchObject({ obtained: 85, maxTotal: 100, rank: 1, rankOf: 3 });
    expect(byId(2)).toMatchObject({ obtained: 85, rank: 1 });
    expect(byId(3).rank).toBe(3);
  });

  it('counts only attempted subjects toward the maximum', () => {
    expect(byId(3)).toMatchObject({ obtained: 10, maxTotal: 50, attempted: 1, percentage: 20, grade: 'E', failedSubjects: 1 });
  });

  it('leaves students with no marks unranked', () => {
    expect(byId(4)).toMatchObject({ attempted: 0, percentage: null, grade: null, rank: null });
  });

  it('keeps the percentage unrounded (grade uses the exact value)', () => {
    const [s] = computeEventSummaries([1], [{ totalMarks: 7, passingMarks: 3, marks: [{ studentId: 1, marksObtained: 6, isAbsent: false }] }]);
    expect(s.percentage).toBeCloseTo(85.714, 3);
    expect(s.grade).toBe('A2');
  });
});
