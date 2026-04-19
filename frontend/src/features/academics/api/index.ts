import { Subject, Chapter, Exam, TeacherSubjectAssignment, StudentExamMark, SubjectWithChapters, PendingExam, SyllabusSubject } from '../types';

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

// ── Subjects ──────────────────────────────────────────────────────────────────

export const subjectApi = {
  list: async (sessionId: number, classId: number): Promise<Subject[]> => {
    const body = await req(`/api/academic/subjects?sessionId=${sessionId}&classId=${classId}`);
    return body.data;
  },
  create: async (data: { sessionId: number; classId: number; name: string }): Promise<Subject> => {
    const body = await req('/api/academic/subjects', { method: 'POST', body: JSON.stringify(data) });
    return body.data;
  },
  update: async (id: number, name: string): Promise<Subject> => {
    const body = await req(`/api/academic/subjects/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
    return body.data;
  },
  delete: async (id: number): Promise<void> => {
    await req(`/api/academic/subjects/${id}`, { method: 'DELETE' });
  },
};

// ── Chapters ──────────────────────────────────────────────────────────────────

export const chapterApi = {
  list: async (subjectId: number): Promise<Chapter[]> => {
    const body = await req(`/api/academic/chapters?subjectId=${subjectId}`);
    return body.data;
  },
  create: async (data: { subjectId: number; name: string; orderNumber: number }): Promise<Chapter> => {
    const body = await req('/api/academic/chapters', { method: 'POST', body: JSON.stringify(data) });
    return body.data;
  },
  update: async (id: number, data: Partial<{ name: string; orderNumber: number; isTaught: boolean; taughtOn: string }>): Promise<Chapter> => {
    const body = await req(`/api/academic/chapters/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return body.data;
  },
  delete: async (id: number): Promise<void> => {
    await req(`/api/academic/chapters/${id}`, { method: 'DELETE' });
  },
  uploadPDF: async (id: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('pdf', file);
    const response = await fetch(`${API_BASE_URL}/api/academic/chapters/${id}/pdf`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const body = await response.json();
    if (!body.success) throw new Error(body.message || 'Upload failed');
    return body.data.pdfUrl as string;
  },
  deletePDF: async (id: number): Promise<void> => {
    await req(`/api/academic/chapters/${id}/pdf`, { method: 'DELETE' });
  },
};

// ── Exams ─────────────────────────────────────────────────────────────────────

export const examApi = {
  list: async (chapterId: number): Promise<Exam[]> => {
    const body = await req(`/api/academic/exams?chapterId=${chapterId}`);
    return body.data;
  },
  create: async (data: { chapterId: number; name: string; totalMarks: number; passingMarks: number; examDate?: string }): Promise<Exam> => {
    const body = await req('/api/academic/exams', { method: 'POST', body: JSON.stringify(data) });
    return body.data;
  },
  update: async (id: number, data: Partial<{ name: string; totalMarks: number; passingMarks: number; examDate: string }>): Promise<Exam> => {
    const body = await req(`/api/academic/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return body.data;
  },
  delete: async (id: number): Promise<void> => {
    await req(`/api/academic/exams/${id}`, { method: 'DELETE' });
  },
};

// ── Marks ─────────────────────────────────────────────────────────────────────

export const marksApi = {
  getByExam: async (examId: number, sectionId?: number, sessionId?: number): Promise<StudentExamMark[]> => {
    const params = new URLSearchParams({ examId: String(examId) });
    if (sectionId) params.append('sectionId', String(sectionId));
    if (sessionId) params.append('sessionId', String(sessionId));
    const body = await req(`/api/academic/marks?${params.toString()}`);
    return body.data;
  },
  getByStudent: async (studentId: number, sessionId: number): Promise<SubjectWithChapters[]> => {
    const body = await req(`/api/academic/marks/student/${studentId}?sessionId=${sessionId}`);
    return body.data;
  },
  getPending: async (classId: number, sectionId: number, sessionId: number): Promise<PendingExam[]> => {
    const body = await req(`/api/academic/marks/pending?classId=${classId}&sectionId=${sectionId}&sessionId=${sessionId}`);
    return body.data;
  },
};

// ── Teacher Assignments ───────────────────────────────────────────────────────

export const assignmentApi = {
  list: async (filters: { sessionId?: number; subjectId?: number; sectionId?: number }): Promise<TeacherSubjectAssignment[]> => {
    const params = new URLSearchParams();
    if (filters.sessionId) params.append('sessionId', String(filters.sessionId));
    if (filters.subjectId) params.append('subjectId', String(filters.subjectId));
    if (filters.sectionId) params.append('sectionId', String(filters.sectionId));
    const body = await req(`/api/academic/assignments?${params.toString()}`);
    return body.data;
  },
  create: async (data: { subjectId: number; staffId: number; sectionId: number; sessionId: number }): Promise<TeacherSubjectAssignment> => {
    const body = await req('/api/academic/assignments', { method: 'POST', body: JSON.stringify(data) });
    return body.data;
  },
  delete: async (id: number): Promise<void> => {
    await req(`/api/academic/assignments/${id}`, { method: 'DELETE' });
  },
};

// ── Syllabus Progress ─────────────────────────────────────────────────────────

export const syllabusApi = {
  getProgress: async (classId: number, sessionId: number): Promise<SyllabusSubject[]> => {
    const body = await req(`/api/academic/syllabus-progress?classId=${classId}&sessionId=${sessionId}`);
    return body.data;
  },
};
