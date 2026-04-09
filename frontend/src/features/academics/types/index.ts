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

export interface Exam {
  id: number;
  chapterId: number;
  schoolId: number;
  name: string;
  totalMarks: number;
  passingMarks: number;
  examDate: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
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
  student?: { id: number; firstName: string; lastName: string };
  enteredByUser?: { id: number; firstName: string; lastName: string };
}

export interface ExamWithMarks extends Exam {
  marks: StudentExamMark[];
}

export interface ChapterWithExams extends Chapter {
  exams: ExamWithMarks[];
}

export interface SubjectWithChapters extends Subject {
  chapters: ChapterWithExams[];
}

export interface PendingExam {
  examId: number;
  examName: string;
  chapterName: string;
  subjectName: string;
  subjectId: number;
  totalMarks: number;
  examDate: string | null;
  teacher: { id: number; name: string } | null;
  totalStudents: number;
  marksEntered: number;
  status: string;
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
