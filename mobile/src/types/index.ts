export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
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
}

export interface Section {
  id: number;
  name: string;
  classId: number;
  schoolId: number;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER';
  schoolId: number;
}

export interface LoginResponse {
  userId: number;
  schoolId: number;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER';
  token?: string;
}

export interface BulkAttendanceRequest {
  attendances: Array<{
    studentId: number;
    status: AttendanceStatus;
    remarks?: string | null;
  }>;
}

export interface BulkAttendanceResponse {
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
  city: string;
  state: string;
  pincode: string;
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
  city?: string;
  state?: string;
  pincode?: string;
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
