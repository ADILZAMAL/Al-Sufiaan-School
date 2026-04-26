export interface Subject {
  id: number;
  schoolId: number;
  sessionId: number;
  classId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: number;
  subjectId: number;
  schoolId: number;
  name: string;
  orderNumber: number;
  isTaught: boolean;
  taughtOn: string | null;
  taughtBy: number | null;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamEvent {
  id: number;
  name: string;
  sessionId: number;
  schoolId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  subjectExams?: Exam[];
}

export interface Exam {
  id: number;
  subjectId: number;
  examEventId: number | null;
  chapterId?: number | null; // kept for migration compatibility
  schoolId: number;
  name: string;
  totalMarks: number;
  passingMarks: number;
  examDate: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  examEvent?: { id: number; name: string } | null;
  examChapters?: { chapter: { id: number; name: string; orderNumber: number } }[];
}

export interface StudentExamMark {
  id: number;
  examId: number;
  studentId: number;
  schoolId: number;
  marksObtained: number | null;
  isAbsent: boolean;
  enteredBy: number;
  enteredAt: string;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    admissionNumber?: string;
    fatherName?: string;
    studentPhoto?: string;
    enrollments?: { rollNumber?: string | null }[];
  };
  enteredByUser?: { id: number; firstName: string; lastName: string };
}

export interface ExamWithMarks extends Exam {
  marks: StudentExamMark[];
}

export interface SubjectWithExams extends Subject {
  exams: ExamWithMarks[];
}

// Kept for any pages not yet migrated
export interface ChapterWithExams extends Chapter {
  exams: ExamWithMarks[];
}

export interface SubjectWithChapters extends Subject {
  chapters: ChapterWithExams[];
}

export interface PendingExam {
  examId: number;
  examName: string;
  subjectName: string;
  subjectId: number;
  examEventName: string | null;
  totalMarks: number;
  examDate: string | null;
  teacher: { id: number; name: string } | null;
  totalStudents: number;
  marksEntered: number;
  status: string;
}

// ── Report Card Types ──────────────────────────────────────────────────────────

export interface EventReportStudentMark {
  studentId: number;
  studentName: string;
  admissionNumber: string | null;
  rollNumber: string | null;
  marksObtained: number | null;
  isAbsent: boolean;
}

export interface EventReportSubject {
  subjectId: number;
  subjectName: string;
  examId: number;
  totalMarks: number;
  passingMarks: number;
  examDate: string | null;
  marks: EventReportStudentMark[];
}

export interface EventReportCard {
  examEvent: ExamEvent;
  students: { studentId: number; studentName: string; admissionNumber: string | null; rollNumber: string | null }[];
  subjects: EventReportSubject[];
}

export interface AnnualEventResult {
  eventId: number;
  eventName: string;
  examId?: number;
  marksObtained: number | null;
  totalMarks: number | null;
  passingMarks: number | null;
  isAbsent: boolean;
  examDate: string | null;
}

export interface AnnualReportSubject {
  subjectId: number;
  subjectName: string;
  classTestAvg: {
    count: number;
    obtained: number;
    total: number;
    percentage: number | null;
  };
  examEvents: AnnualEventResult[];
}

export interface AnnualReportCard {
  student: {
    id: number;
    firstName: string;
    lastName: string;
    admissionNumber: string | null;
    studentPhoto: string | null;
  };
  enrollment: {
    class: { id: number; name: string };
    section: { id: number; name: string };
    rollNumber: string | null;
  };
  examEvents: { id: number; name: string }[];
  subjects: AnnualReportSubject[];
}

export interface SyllabusChapter {
  id: number;
  name: string;
  orderNumber: number;
  isTaught: boolean;
  taughtOn: string | null;
}

export interface SyllabusSubject {
  subjectId: number;
  subjectName: string;
  totalChapters: number;
  taughtChapters: number;
  progressPct: number;
  chapters: SyllabusChapter[];
}

export interface TeacherSubjectAssignment {
  id: number;
  schoolId: number;
  subjectId: number;
  staffId: number;
  sectionId: number;
  sessionId: number;
  assignedBy: number;
  teacher?: { id: number; name: string };
  subject?: { id: number; name: string; classId: number; sessionId: number };
  section?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}
