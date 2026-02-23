export interface AcademicSession {
  id: number;
  schoolId: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  // populated by getSessionById
  classCount?: number;
  enrollmentCount?: number;
  attendanceCount?: number;
  feeCount?: number;
}

export interface StudentEnrollment {
  id: number;
  studentId: number;
  sessionId: number;
  classId: number;
  sectionId: number;
  rollNumber?: string;
  promotedBy?: number;
  promotedAt?: string;
  session?: AcademicSession;
  class?: { id: number; name: string };
  section?: { id: number; name: string };
  student?: { id: number; name: string; admissionNumber?: string };
}

export interface EnrollStudentRequest {
  studentId: number;
  classId: number;
  sectionId: number;
  rollNumber?: string;
}

export interface UpdateEnrollmentRequest {
  classId?: number;
  sectionId?: number;
  rollNumber?: string;
}
