import { Router } from 'express';
import verifyToken, { requireRole } from '../middleware/auth';
import {
  createSubject, getSubjects, updateSubject, deleteSubject,
  createAssignment, getAssignments, deleteAssignment,
  createChapter, getChapters, updateChapter, deleteChapter,
  uploadChapterPDF, deleteChapterPDF,
  createExamEvent, getExamEvents, updateExamEvent, deleteExamEvent,
  createExam, getExams, updateExam, deleteExam,
  bulkSubmitMarks, getMarksByExam, getStudentMarks, getPendingMarks,
  getEventReportCard, getAnnualReportCard,
  getSyllabusProgress,
} from '../controllers/academic';
import { uploadSinglePDF } from '../middleware/upload';

const router = Router();

router.use(verifyToken);

// Subjects
router.post('/subjects', requireRole(['SUPER_ADMIN', 'ADMIN']), createSubject);
router.get('/subjects', getSubjects);
router.put('/subjects/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), updateSubject);
router.delete('/subjects/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), deleteSubject);

// Teacher assignments
router.post('/assignments', requireRole(['SUPER_ADMIN', 'ADMIN']), createAssignment);
router.get('/assignments', getAssignments);
router.delete('/assignments/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), deleteAssignment);

// Chapters
router.post('/chapters', requireRole(['SUPER_ADMIN', 'ADMIN']), createChapter);
router.get('/chapters', getChapters);
router.put('/chapters/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), updateChapter);
router.delete('/chapters/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), deleteChapter);
router.post('/chapters/:id/pdf', requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), uploadSinglePDF, uploadChapterPDF);
router.delete('/chapters/:id/pdf', requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), deleteChapterPDF);

// Exam events
router.post('/exam-events', requireRole(['SUPER_ADMIN', 'ADMIN']), createExamEvent);
router.get('/exam-events', getExamEvents);
router.put('/exam-events/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), updateExamEvent);
router.delete('/exam-events/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), deleteExamEvent);

// Exams
router.post('/exams', requireRole(['SUPER_ADMIN', 'ADMIN']), createExam);
router.get('/exams', getExams);
router.put('/exams/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), updateExam);
router.delete('/exams/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), deleteExam);

// Marks
router.post('/marks/bulk', requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), bulkSubmitMarks);
router.get('/marks', getMarksByExam);
router.get('/marks/pending', requireRole(['SUPER_ADMIN', 'ADMIN']), getPendingMarks);
router.get('/marks/student/:studentId', getStudentMarks);

// Report cards
router.get('/report-card/event', getEventReportCard);
router.get('/report-card/annual', getAnnualReportCard);

// Syllabus progress
router.get('/syllabus-progress', getSyllabusProgress);

export default router;
