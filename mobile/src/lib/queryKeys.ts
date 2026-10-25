/** Central query keys so invalidation after a save hits the right caches. */
export const queryKeys = {
  activeSession: ['session', 'active'] as const,
  classes: ['classes'] as const,
  myAssignments: ['my-assignments', { include: 'progress' }] as const,
  holidayCheck: (date: string) => ['holiday-check', date] as const,
  holidays: (from: string, to: string) => ['holidays', from, to] as const,
  dayStats: (date: string) => ['attendance', 'day-stats', date] as const,

  attendanceSheet: (classId: number, sectionId: number, date: string) =>
    ['attendance', 'sheet', classId, sectionId, date] as const,
  boardingSheet: (boardingType: string, date: string) => ['attendance', 'boarding', boardingType, date] as const,
  attendance: ['attendance'] as const,
  attendanceHistory: (classId: number, sectionId: number, from: string, to: string) =>
    ['attendance', 'history', classId, sectionId, from, to] as const,
  studentCalendar: (studentId: number) => ['attendance', 'student', studentId] as const,

  sectionStudents: (classId: number, sectionId: number) => ['students', 'section', classId, sectionId] as const,
  student: (studentId: number) => ['students', 'detail', studentId] as const,

  chapters: (subjectId: number) => ['academic', 'chapters', subjectId] as const,
  exams: (subjectId: number, sectionId: number) => ['academic', 'exams', subjectId, sectionId] as const,
  marks: (examId: number, sectionId: number) => ['academic', 'marks', examId, sectionId] as const,
  examEvents: (sessionId: number) => ['academic', 'exam-events', sessionId] as const,
  eventReport: (examEventId: number, sectionId: number) => ['academic', 'report', examEventId, sectionId] as const,
  annualReport: (studentId: number, sessionId: number) => ['academic', 'annual', studentId, sessionId] as const,

  payslips: (staffId: number) => ['payslips', staffId] as const,
  payslip: (payslipId: number) => ['payslips', 'detail', payslipId] as const,
};
