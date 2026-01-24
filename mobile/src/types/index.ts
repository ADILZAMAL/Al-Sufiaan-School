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
