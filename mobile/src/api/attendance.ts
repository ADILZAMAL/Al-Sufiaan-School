import apiClient from './client';
import {
  AttendanceDayStats,
  AttendanceHistory,
  AttendanceType,
  BoardingStudent,
  BulkAttendanceRequest,
  BulkAttendanceResponse,
  Student,
  StudentAttendanceCalendar,
} from '../types';

export const attendanceApi = {
  // Get students with attendance status for a class/section
  getStudentsWithAttendance: async (
    classId: number,
    sectionId: number,
    date?: string
  ): Promise<Student[]> => {
    const dateParam = date ? `?date=${date}` : '';
    const response = await apiClient.get<{ success: boolean; data: Student[] }>(
      `/attendance/students/${classId}/${sectionId}${dateParam}`
    );
    return response.data.data;
  },

  // Bulk mark attendance
  bulkMarkAttendance: async (
    data: BulkAttendanceRequest
  ): Promise<BulkAttendanceResponse> => {
    const response = await apiClient.post<{ success: boolean; data: BulkAttendanceResponse }>(
      '/attendance',
      data
    );
    return response.data.data;
  },

  // Get boarding students (hostel or dayboarding) with attendance for a date
  getBoardingStudentsWithAttendance: async (
    boardingType: 'HOSTEL' | 'DAYBOARDING',
    date?: string
  ): Promise<BoardingStudent[]> => {
    const params = new URLSearchParams({ boardingType });
    if (date) params.append('date', date);
    const response = await apiClient.get<{ success: boolean; data: BoardingStudent[] }>(
      `/attendance/boarding-students?${params.toString()}`
    );
    return response.data.data;
  },

  // Per-day and per-student attendance for a section over a date range (max 62 days)
  getHistory: async (params: {
    classId: number;
    sectionId: number;
    from: string;
    to: string;
    attendanceType?: AttendanceType;
  }): Promise<AttendanceHistory> => {
    const response = await apiClient.get<{ success: boolean; data: AttendanceHistory }>('/attendance/history', { params });
    return response.data.data;
  },

  // One student's attendance and holidays for the active session
  getStudentCalendar: async (studentId: number): Promise<StudentAttendanceCalendar> => {
    const response = await apiClient.get<{ success: boolean; data: StudentAttendanceCalendar }>(
      `/attendance/calendar/${studentId}`
    );
    return response.data.data;
  },

  // Present/absent/not-marked counts for every class & section on a date
  getAllStats: async (date: string): Promise<AttendanceDayStats> => {
    const response = await apiClient.get<{ success: boolean; data: AttendanceDayStats }>('/attendance/stats/all', { params: { date } });
    return response.data.data;
  },
};
