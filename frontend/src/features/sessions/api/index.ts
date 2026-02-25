import { AcademicSession, StudentEnrollment, EnrollStudentRequest, UpdateEnrollmentRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || '';

const req = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const body = await response.json();
  if (!body.success) throw new Error(body.message || 'Request failed');
  return body;
};

export const academicSessionApi = {
  getSessions: async (): Promise<AcademicSession[]> => {
    const body = await req('/api/sessions');
    return body.data;
  },

  getActiveSession: async (): Promise<AcademicSession | null> => {
    try {
      const body = await req('/api/sessions/active');
      return body.data;
    } catch {
      return null;
    }
  },

  getSessionById: async (id: number): Promise<AcademicSession> => {
    const body = await req(`/api/sessions/${id}`);
    return body.data;
  },

  createSession: async (data: { name: string; startDate: string; endDate: string }): Promise<AcademicSession> => {
    const body = await req('/api/sessions', { method: 'POST', body: JSON.stringify(data) });
    return body.data;
  },

  activateSession: async (id: number): Promise<AcademicSession> => {
    const body = await req(`/api/sessions/${id}/activate`, { method: 'PATCH' });
    return body.data;
  },

  updateSession: async (id: number, data: Partial<{ name: string; startDate: string; endDate: string }>): Promise<AcademicSession> => {
    const body = await req(`/api/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return body.data;
  },

  deleteSession: async (id: number): Promise<void> => {
    await req(`/api/sessions/${id}`, { method: 'DELETE' });
  },
};

export const enrollmentApi = {
  getEnrollments: async (sessionId: number, filters?: { classId?: number; sectionId?: number }): Promise<StudentEnrollment[]> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', filters.classId.toString());
    if (filters?.sectionId) params.append('sectionId', filters.sectionId.toString());
    const body = await req(`/api/sessions/${sessionId}/enrollments?${params.toString()}`);
    return body.data;
  },

  getStudentEnrollments: async (studentId: number): Promise<StudentEnrollment[]> => {
    const body = await req(`/api/students/${studentId}/enrollments`);
    return body.data;
  },

  enrollStudent: async (sessionId: number, data: EnrollStudentRequest): Promise<StudentEnrollment> => {
    const body = await req(`/api/sessions/${sessionId}/enroll`, { method: 'POST', body: JSON.stringify(data) });
    return body.data;
  },

  updateEnrollment: async (id: number, data: UpdateEnrollmentRequest): Promise<StudentEnrollment> => {
    const body = await req(`/api/enrollments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return body.data;
  },

  deleteEnrollment: async (id: number): Promise<void> => {
    await req(`/api/enrollments/${id}`, { method: 'DELETE' });
  },
};
