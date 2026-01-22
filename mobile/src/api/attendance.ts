import apiClient from './client';
import { BulkAttendanceRequest, BulkAttendanceResponse, Student, AttendanceRecord } from '../types';

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

  // Get attendance records
  getAttendance: async (params?: {
    date?: string;
    classId?: number;
    sectionId?: number;
    studentId?: number;
  }): Promise<AttendanceRecord[]> => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.classId) queryParams.append('classId', params.classId.toString());
    if (params?.sectionId) queryParams.append('sectionId', params.sectionId.toString());
    if (params?.studentId) queryParams.append('studentId', params.studentId.toString());

    const queryString = queryParams.toString();
    const url = `/attendance${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<{ success: boolean; data: AttendanceRecord[] }>(url);
    return response.data.data;
  },

  // Get single attendance record
  getAttendanceById: async (id: number): Promise<AttendanceRecord> => {
    const response = await apiClient.get<{ success: boolean; data: AttendanceRecord }>(
      `/attendance/${id}`
    );
    return response.data.data;
  },
};
