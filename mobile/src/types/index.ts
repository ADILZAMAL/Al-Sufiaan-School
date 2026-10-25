export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
}

export enum AttendanceType {
  CLASS       = 'CLASS',
  HOSTEL      = 'HOSTEL',
  DAYBOARDING = 'DAYBOARDING',
}

export interface BoardingStudent {
  id: number;
  firstName: string;
  lastName: string;
  studentPhoto?: string;
  hostel: boolean;
  dayboarding: boolean;
  rollNumber: string | null;
  class: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
  attendance?: {
    id: number;
    status: AttendanceStatus;
    remarks?: string | null;
  } | null;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  studentPhoto?: string;
  class: {
    id: number;
    name: string;
  };
  section: {
    id: number;
    name: string;
  };
  attendance?: {
    id: number;
    status: AttendanceStatus;
    remarks?: string | null;
  } | null;
  /** Consecutive ABSENT records up to the requested date (0 if present / none). */
  consecutiveAbsences?: number;
  /** @deprecated legacy alias of consecutiveAbsences (null when 0) */
  daysAbsentSinceLastPresent?: number | null;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  date: string;
  status: AttendanceStatus;
  markedBy: number;
  schoolId: number;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Student;
}

export interface Class {
  id: number;
  name: string;
  schoolId: number;
  sequence?: number | null;
  sections: Section[];
}

export interface Section {
  id: number;
  name: string;
  classId: number;
  schoolId: number;
}

export interface LoginResponse {
  userId: number;
  schoolId: number;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER' | 'TEACHER';
  staffId?: number | null;
  staffName?: string | null;
  token?: string;
}

export interface BulkAttendanceRequest {
  /** YYYY-MM-DD (device-local); defaults to today on the server */
  date?: string;
  attendanceType?: AttendanceType;
  attendances: Array<{
    studentId: number;
    status: AttendanceStatus;
    remarks?: string | null;
  }>;
}

export interface BulkAttendanceResponse {
  date?: string;
  success: number;
  failed: number;
  attendances: AttendanceRecord[];
  errors?: Array<{
    studentId: number;
    error: string;
  }>;
}

export interface StudentEnrollment {
  id: number;
  sessionId: number;
  classId: number;
  sectionId: number | null;
  rollNumber: string | null;
  class: { id: number; name: string };
  section: { id: number; name: string } | null;
  session: { id: number; name: string; isActive: boolean };
}

export interface StudentDetail {
  id: number;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'NA';
  religion: 'Islam' | 'Hinduism' | 'Christianity' | 'Sikhism' | 'Buddhism' | 'Jainism' | 'Other';
  phone: string;
  email?: string | null;
  address: string;
  fatherName: string;
  fatherPhone?: string | null;
  motherName: string;
  motherPhone?: string | null;
  guardianName?: string | null;
  guardianRelation?: string | null;
  guardianPhone?: string | null;
  studentPhoto?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  enrollments: StudentEnrollment[];
}

export interface StudentUpdatePayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'NA';
  religion?: 'Islam' | 'Hinduism' | 'Christianity' | 'Sikhism' | 'Buddhism' | 'Jainism' | 'Other';
  phone?: string;
  email?: string | null;
  address?: string;
  fatherName?: string;
  fatherPhone?: string | null;
  motherName?: string;
  motherPhone?: string | null;
  guardianName?: string | null;
  guardianRelation?: string | null;
  guardianPhone?: string | null;
  studentPhoto?: string | null;
}

export interface PhotoUploadResponse {
  studentPhoto?: {
    url: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
  };
}

export interface AcademicSession {
  id: number;
  name: string;
  isActive: boolean;
}

export interface AcademicSubject {
  id: number;
  name: string;
}

/** One subject the teacher teaches in one section (GET /academic/my-assignments). */
export interface MyAssignment {
  id: number;
  sessionId: number;
  subject: { id: number; name: string };
  class: { id: number; name: string; sequence: number | null };
  section: { id: number; name: string };
  progress?: { examCount: number; classTestCount: number; pendingExamCount: number };
}

export interface MyAssignmentsResponse {
  session: { id: number; name: string } | null;
  assignments: MyAssignment[];
}

export interface AcademicChapter {
  id: number;
  name: string;
  orderNumber: number;
  isTaught: boolean;
  taughtOn: string | null;
  pdfUrl: string | null;
}

export interface AcademicExam {
  id: number;
  name: string;
  totalMarks: number;
  passingMarks: number;
  examDate: string | null;
  subjectId: number;
  examEventId: number | null;
  /** Class tests belong to one section; null = all sections (exam-event papers, older tests). */
  sectionId?: number | null;
  section?: { id: number; name: string } | null;
  createdBy?: number;
  examEvent?: { id: number; name: string } | null;
  examChapters?: { chapterId: number; chapter: { id: number; name: string; orderNumber: number } }[];
  /** Present when requested with withProgress=true. */
  progress?: { enrolled: number; entered: number };
}

export interface ClassTestInput {
  name: string;
  totalMarks: number;
  passingMarks: number;
  examDate: string | null;
  chapterIds: number[];
}

/** One row of GET /academic/marks with section + session (full roster). */
export interface MarksRosterRow {
  id: number | null;
  examId: number;
  studentId: number;
  /** DECIMAL columns arrive as strings, e.g. "18.50". */
  marksObtained: string | number | null;
  isAbsent: boolean;
  enteredAt: string | null;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    admissionNumber?: string;
    fatherName?: string | null;
    studentPhoto?: string | null;
    enrollments: { rollNumber: string | null }[];
  };
}

export interface Holiday {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  schoolId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: number;
  payslipNumber: string;
  staffId: number;
  month: number;
  year: number;
  monthName: string;
  staffName: string;
  staffRole: string;
  schoolName: string;
  baseSalary: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  casualLeave: number;
  halfDays: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  totalPaidAmount: number;
  remainingAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  lastPaymentDate: string | null;
}

export interface PayslipPayment {
  id: number;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer';
  notes: string | null;
}

export interface PayslipWithPayments extends Payslip {
  payments: PayslipPayment[];
}

export interface PayslipListResponse {
  payslips: Payslip[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Attendance history ──────────────────────────────────────────────────────

export type AttendanceDayStatus = 'MARKED' | 'PARTIAL' | 'NOT_MARKED' | 'HOLIDAY' | 'FUTURE';

export interface AttendanceHistoryDay {
  date: string;
  status: AttendanceDayStatus;
  isHoliday: boolean;
  holidayName: string | null;
  present: number;
  absent: number;
  notMarked: number;
  lastMarkedBy: string | null;
  lastMarkedAt: string | null;
}

export interface AttendanceHistoryStudent {
  studentId: number;
  firstName: string;
  lastName: string;
  studentPhoto: string | null;
  rollNumber: string | null;
  present: number;
  absent: number;
  percentage: number | null;
  consecutiveAbsences: number;
}

export interface AttendanceHistory {
  classId: number;
  sectionId: number;
  from: string;
  to: string;
  session: { id: number; name: string } | null;
  totalStudents: number;
  days: AttendanceHistoryDay[];
  students: AttendanceHistoryStudent[];
  summary: { workingDays: number; markedDays: number; holidays: number; averagePercentage: number | null };
}

export interface AttendanceTypeSummary {
  totalPresent: number;
  totalAbsent: number;
  totalWorkingDays: number;
  attendancePercentage: number;
}

export type StudentCalendarRecord =
  | { date: string; status: AttendanceStatus; attendanceType: AttendanceType; remarks: string | null }
  | { date: string; status: 'HOLIDAY'; name: string; reason?: string | null };

export interface StudentAttendanceCalendar {
  studentId: number;
  studentName: string;
  hostel: boolean;
  dayboarding: boolean;
  class: string | null;
  section: string | null;
  attendanceRecords: StudentCalendarRecord[];
  summary: {
    class: AttendanceTypeSummary;
    hostel?: AttendanceTypeSummary;
    dayboarding?: AttendanceTypeSummary;
    totalHolidays: number;
  };
}

// ─── Report cards ────────────────────────────────────────────────────────────

export interface ExamEventSummary {
  id: number;
  name: string;
  sessionId: number;
  /** Classes that have papers set up for this event. */
  classIds?: number[];
}

export interface EventReportStudent {
  studentId: number;
  studentName: string;
  admissionNumber: string | null;
  rollNumber: string | null;
  fatherName: string | null;
  studentPhoto: string | null;
}

export interface EventReportSubject {
  subjectId: number;
  subjectName: string;
  examId: number;
  totalMarks: number;
  passingMarks: number;
  examDate: string | null;
  marks: { studentId: number; marksObtained: number | null; isAbsent: boolean; grade: string | null }[];
}

export interface EventReportSummary {
  studentId: number;
  obtained: number;
  maxTotal: number;
  attempted: number;
  /** Unrounded; null when nothing attempted. */
  percentage: number | null;
  grade: string | null;
  rank: number | null;
  rankOf: number;
  failedSubjects: number;
}

export interface EventReportCard {
  examEvent: { id: number; name: string };
  class: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
  session: { id: number; name: string } | null;
  students: EventReportStudent[];
  subjects: EventReportSubject[];
  summaries: EventReportSummary[];
  classStats: { studentsWithMarks: number; highestPercentage: number | null; averagePercentage: number | null };
  gradeScale: { grade: string; min: number }[];
}

export interface AnnualReportCard {
  student: { id: number; firstName: string; lastName: string; admissionNumber: string | null; studentPhoto: string | null };
  enrollment?: { class: { id: number; name: string } | null; section: { id: number; name: string } | null; rollNumber: string | null };
  examEvents?: { id: number; name: string }[];
  subjects: {
    subjectId: number;
    subjectName: string;
    classTestAvg: { count: number; obtained: number; total: number; percentage: number | null };
    examEvents: {
      eventId: number;
      eventName: string;
      examId?: number;
      marksObtained: number | null;
      totalMarks: number | null;
      passingMarks: number | null;
      isAbsent: boolean;
      examDate: string | null;
    }[];
  }[];
}

export interface SectionDayStats {
  classId: number;
  className: string;
  sectionId: number;
  sectionName: string;
  date: string;
  presentCount: number;
  absentCount: number;
  totalMarked: number;
  totalStudents: number;
  attendancePercentage: number;
  notMarked: number;
  isHoliday: boolean;
  holidayName: string | null;
}

export interface AttendanceDayStats {
  date: string;
  classStats: SectionDayStats[];
  isHoliday?: boolean;
  holidayName?: string | null;
}
