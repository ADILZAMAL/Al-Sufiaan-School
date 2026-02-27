import apiClient from './client';
import { Student, StudentDetail, StudentUpdatePayload } from '../types';

export const studentApi = {
  getById: async (id: number): Promise<StudentDetail> => {
    const response = await apiClient.get<{ success: boolean; data: StudentDetail }>(
      `/students/${id}`
    );
    return response.data.data;
  },

  update: async (id: number, payload: StudentUpdatePayload): Promise<StudentDetail> => {
    const response = await apiClient.put<{ success: boolean; data: StudentDetail }>(
      `/students/${id}`,
      payload
    );
    return response.data.data;
  },

  updateEnrollment: async (enrollmentId: number, rollNumber: string | null): Promise<void> => {
    await apiClient.put(`/enrollments/${enrollmentId}`, { rollNumber });
  },

  getBySection: async (classId: number, sectionId: number): Promise<Student[]> => {
    const response = await apiClient.get<{ success: boolean; data: Student[] }>(
      `/students/class/${classId}`,
      { params: { sectionId } }
    );
    return response.data.data;
  },
};
