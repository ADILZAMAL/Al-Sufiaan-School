import apiClient from './client';
import {
  AcademicChapter,
  AcademicExam,
  AcademicSession,
  AnnualReportCard,
  ClassTestInput,
  EventReportCard,
  ExamEventSummary,
  MarksRosterRow,
  MyAssignmentsResponse,
} from '../types';
import { getStatus } from '../lib/errors';

export const academicApi = {
  /** The active session, or null when the school has none (404). */
  getActiveSession: async (): Promise<AcademicSession | null> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: AcademicSession }>('/sessions/active');
      return response.data.data;
    } catch (error) {
      if (getStatus(error) === 404) return null;
      throw error;
    }
  },

  /** The signed-in teacher's subject + section assignments for the active session. */
  getMyAssignments: async (): Promise<MyAssignmentsResponse> => {
    const response = await apiClient.get<{ success: boolean; data: MyAssignmentsResponse }>('/academic/my-assignments', {
      params: { include: 'progress' },
    });
    return response.data.data;
  },

  getChapters: async (subjectId: number): Promise<AcademicChapter[]> => {
    const response = await apiClient.get<{ success: boolean; data: AcademicChapter[] }>(
      `/academic/chapters?subjectId=${subjectId}`
    );
    return response.data.data;
  },

  /** A section's exams (its class tests + exam-event papers) with marks-entry progress. */
  getExams: async (params: { subjectId: number; sectionId: number; sessionId: number }): Promise<AcademicExam[]> => {
    const response = await apiClient.get<{ success: boolean; data: AcademicExam[] }>('/academic/exams', {
      params: { ...params, withProgress: true },
    });
    return response.data.data;
  },

  createClassTest: async (data: ClassTestInput & { subjectId: number; sectionId: number }): Promise<AcademicExam> => {
    const response = await apiClient.post<{ success: boolean; data: AcademicExam }>('/academic/exams', data);
    return response.data.data;
  },

  updateClassTest: async (examId: number, data: ClassTestInput): Promise<AcademicExam> => {
    const response = await apiClient.put<{ success: boolean; data: AcademicExam }>(`/academic/exams/${examId}`, data);
    return response.data.data;
  },

  /** Without `force`, fails with 409 `{ markCount }` when marks have been entered. */
  deleteClassTest: async (examId: number, force = false): Promise<void> => {
    await apiClient.delete(`/academic/exams/${examId}`, { params: force ? { force: true } : undefined });
  },

  /** Every active student in the section with their mark (or a blank row). */
  getMarksRoster: async (examId: number, sectionId: number, sessionId: number): Promise<MarksRosterRow[]> => {
    const response = await apiClient.get<{ success: boolean; data: MarksRosterRow[] }>('/academic/marks', {
      params: { examId, sectionId, sessionId },
    });
    return response.data.data;
  },

  bulkSubmitMarks: async (
    examId: number,
    marks: Array<{ studentId: number; marksObtained: number | null; isAbsent: boolean }>,
    sectionId?: number
  ): Promise<void> => {
    await apiClient.post('/academic/marks/bulk', { examId, sectionId, marks });
  },

  markChapterTaught: async (chapterId: number, isTaught: boolean, taughtOn?: string): Promise<void> => {
    await apiClient.put(`/academic/chapters/${chapterId}`, { isTaught, taughtOn });
  },

  uploadChapterPDF: async (chapterId: number, fileUri: string, fileName: string): Promise<string> => {
    const formData = new FormData();
    formData.append('pdf', { uri: fileUri, name: fileName, type: 'application/pdf' } as any);
    const response = await apiClient.post<{ success: boolean; data: { pdfUrl: string } }>(
      `/academic/chapters/${chapterId}/pdf`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data.pdfUrl;
  },

  deleteChapterPDF: async (chapterId: number): Promise<void> => {
    await apiClient.delete(`/academic/chapters/${chapterId}/pdf`);
  },

  getExamEvents: async (sessionId: number): Promise<ExamEventSummary[]> => {
    const response = await apiClient.get<{ success: boolean; data: ExamEventSummary[] }>('/academic/exam-events', {
      params: { sessionId },
    });
    return response.data.data;
  },

  /** Section report card for an exam event, with server-computed totals, grades and ranks. */
  getEventReportCard: async (params: { examEventId: number; classId: number; sectionId: number; sessionId: number }): Promise<EventReportCard> => {
    const response = await apiClient.get<{ success: boolean; data: EventReportCard }>('/academic/report-card/event', { params });
    return response.data.data;
  },

  /** One student's results across the session (class-test averages + every exam event). */
  getAnnualReportCard: async (studentId: number, sessionId: number): Promise<AnnualReportCard> => {
    const response = await apiClient.get<{ success: boolean; data: AnnualReportCard }>('/academic/report-card/annual', {
      params: { studentId, sessionId },
    });
    return response.data.data;
  },
};
