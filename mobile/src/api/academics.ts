import apiClient from './client';
import { AcademicSession, AcademicSubject, AcademicChapter, AcademicExam, ExamMark } from '../types';

export const academicApi = {
  getActiveSession: async (): Promise<AcademicSession | null> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: AcademicSession }>('/sessions/active');
      return response.data.data;
    } catch {
      return null;
    }
  },

  // Returns subjects assigned to teacher (staffId) for a given section + session
  getAssignedSubjects: async (sessionId: number, sectionId: number, staffId: number): Promise<AcademicSubject[]> => {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      `/academic/assignments?sessionId=${sessionId}&sectionId=${sectionId}&staffId=${staffId}`
    );
    return response.data.data
      .filter((a: any) => a.subject)
      .map((a: any) => ({ id: a.subject.id, name: a.subject.name }));
  },

  getChapters: async (subjectId: number): Promise<AcademicChapter[]> => {
    const response = await apiClient.get<{ success: boolean; data: AcademicChapter[] }>(
      `/academic/chapters?subjectId=${subjectId}`
    );
    return response.data.data;
  },

  getExams: async (chapterId: number): Promise<AcademicExam[]> => {
    const response = await apiClient.get<{ success: boolean; data: AcademicExam[] }>(
      `/academic/exams?chapterId=${chapterId}`
    );
    return response.data.data;
  },

  getMarksByExam: async (examId: number): Promise<ExamMark[]> => {
    const response = await apiClient.get<{ success: boolean; data: ExamMark[] }>(
      `/academic/marks?examId=${examId}`
    );
    return response.data.data;
  },

  bulkSubmitMarks: async (
    examId: number,
    marks: Array<{ studentId: number; marksObtained: number | null; isAbsent: boolean }>
  ): Promise<void> => {
    await apiClient.post('/academic/marks/bulk', { examId, marks });
  },

  markChapterTaught: async (chapterId: number, isTaught: boolean, taughtOn?: string): Promise<void> => {
    await apiClient.put(`/academic/chapters/${chapterId}`, { isTaught, taughtOn });
  },
};
