import { computeStats, markError, parseMark, rankStudents, rosterToEntries, sameEntry, MarkStudent } from '../features/marks/marks';
import { formatPct, ordinal } from '../features/reports/format';

const student = (id: number, roll: string): MarkStudent => ({
  studentId: id, name: `S${id}`, firstName: `S${id}`, lastName: '', rollNumber: roll, photo: null,
});

describe('parseMark / markError', () => {
  it('parses blanks, decimals and rejects garbage', () => {
    expect(parseMark('')).toBeNull();
    expect(parseMark(' 18 ')).toBe(18);
    expect(parseMark('18,5')).toBe(18.5);
    expect(parseMark('18.25')).toBe(18.25);
    expect(parseMark('18.255')).toBeNaN();
    expect(parseMark('abc')).toBeNaN();
  });

  it('validates against the total and ignores absent/blank', () => {
    expect(markError({ value: '21', absent: false }, 20)).toBe('Max 20');
    expect(markError({ value: 'x', absent: false }, 20)).toMatch(/Numbers only/);
    expect(markError({ value: '20', absent: false }, 20)).toBeNull();
    expect(markError({ value: '', absent: false }, 20)).toBeNull();
    expect(markError({ value: '99', absent: true }, 20)).toBeNull();
  });
});

describe('sameEntry', () => {
  it('treats 18 and 18.0 as unchanged but absent as a change', () => {
    expect(sameEntry({ value: '18', absent: false }, { value: '18.0', absent: false })).toBe(true);
    expect(sameEntry({ value: '', absent: true }, { value: '', absent: false })).toBe(false);
    expect(sameEntry(undefined, { value: '', absent: false })).toBe(true);
  });
});

describe('rosterToEntries', () => {
  it('turns DECIMAL strings into clean input text', () => {
    const entries = rosterToEntries([
      { id: 1, examId: 1, studentId: 1, marksObtained: '18.50', isAbsent: false, enteredAt: null, student: { id: 1, firstName: 'A', lastName: 'B', enrollments: [] } },
      { id: 2, examId: 1, studentId: 2, marksObtained: '17.00', isAbsent: false, enteredAt: null, student: { id: 2, firstName: 'C', lastName: 'D', enrollments: [] } },
      { id: null, examId: 1, studentId: 3, marksObtained: null, isAbsent: true, enteredAt: null, student: { id: 3, firstName: 'E', lastName: 'F', enrollments: [] } },
    ]);
    expect(entries[1].value).toBe('18.5');
    expect(entries[2].value).toBe('17');
    expect(entries[3]).toEqual({ value: '', absent: true });
  });
});

describe('stats and ranking', () => {
  const students = [student(1, '1'), student(2, '2'), student(3, '3'), student(4, '4'), student(5, '5')];
  const entries = {
    1: { value: '18', absent: false },
    2: { value: '18', absent: false },
    3: { value: '7', absent: false },
    4: { value: '', absent: true },
    5: { value: '', absent: false },
  };

  it('computes entered/absent/pass counts and averages', () => {
    const stats = computeStats(students, entries, 8);
    expect(stats).toMatchObject({ total: 5, entered: 4, absent: 1, notEntered: 1, passed: 2, failed: 1, highest: 18, lowest: 7 });
    expect(stats.average).toBeCloseTo(14.3, 1);
  });

  it('shares ranks on ties and puts absent before blank at the end', () => {
    const ranked = rankStudents(students, entries, 20, 8);
    expect(ranked.map(r => [r.student.studentId, r.rank])).toEqual([[1, 1], [2, 1], [3, 3], [4, null], [5, null]]);
    expect(ranked[2].passed).toBe(false);
    expect(ranked[0].percentage).toBe(90);
  });
});

describe('report formatting', () => {
  it('formats ordinals and percentages like the web', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st']);
    expect(formatPct(85.714285)).toBe('85.7%');
    expect(formatPct(null)).toBe('—');
  });
});
