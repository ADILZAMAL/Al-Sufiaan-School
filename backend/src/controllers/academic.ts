import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Subject, Chapter, Exam, ExamEvent, ExamChapter, StudentExamMark, TeacherSubjectAssignment, Student, Staff, StudentEnrollment, AcademicSession, Section, Class } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';
import cloudinary, { chapterPDFUploadOptions } from '../config/cloudinary';
import sequelize from '../config/database';
import { handleError, HttpError } from '../utils/httpError';
import { isISODate, todayISO } from '../utils/date';
import { byRollThenName } from '../utils/rollNumber';
import { assertTeacherAssignment, assertTeacherInSection, isTeacher, requireStaffId, resolveEnrollments } from '../utils/teacherScope';
import { computeEventSummaries, GRADE_SCALE, gradeFor } from '../utils/grading';

// ─── SUBJECTS ────────────────────────────────────────────────────────────────

export const createSubject = async (req: Request, res: Response) => {
  try {
    const { sessionId, classId, name } = req.body;
    const schoolId = parseInt(String(req.schoolId));

    if (!sessionId || !classId || !name) {
      return sendError(res, 'sessionId, classId, and name are required', 400);
    }

    const subject = await Subject.create({ schoolId, sessionId, classId, name: name.trim() });
    return sendSuccess(res, subject, 'Subject created successfully', 201);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'Subject already exists for this class and session', 400);
    }
    logger.error('Error creating subject', { error });
    return sendError(res, 'Failed to create subject', 500);
  }
};

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { sessionId, classId } = req.query;

    const where: any = { schoolId };
    if (sessionId) where.sessionId = parseInt(String(sessionId));
    if (classId) where.classId = parseInt(String(classId));

    const subjects = await Subject.findAll({
      where,
      order: [['name', 'ASC']],
    });
    return sendSuccess(res, subjects, 'Subjects retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subjects', { error });
    return sendError(res, 'Failed to fetch subjects', 500);
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));
    const { name } = req.body;

    const subject = await Subject.findOne({ where: { id: parseInt(id), schoolId } });
    if (!subject) return sendError(res, 'Subject not found', 404);

    await subject.update({ name: name.trim() });
    return sendSuccess(res, subject, 'Subject updated successfully');
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'Subject with this name already exists for this class and session', 400);
    }
    logger.error('Error updating subject', { error });
    return sendError(res, 'Failed to update subject', 500);
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));

    const subject = await Subject.findOne({ where: { id: parseInt(id), schoolId } });
    if (!subject) return sendError(res, 'Subject not found', 404);

    await subject.destroy();
    return sendSuccess(res, null, 'Subject deleted successfully');
  } catch (error) {
    logger.error('Error deleting subject', { error });
    return sendError(res, 'Failed to delete subject', 500);
  }
};

// ─── TEACHER ASSIGNMENTS ─────────────────────────────────────────────────────

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { subjectId, staffId, sectionId, sessionId } = req.body;
    const schoolId = parseInt(String(req.schoolId));
    const assignedBy = parseInt(String(req.userId));

    if (!subjectId || !staffId || !sectionId || !sessionId) {
      return sendError(res, 'subjectId, staffId, sectionId, and sessionId are required', 400);
    }

    const subject = await Subject.findOne({ where: { id: subjectId, schoolId } });
    if (!subject) return sendError(res, 'Subject not found', 404);

    const teacher = await Staff.findOne({ where: { id: staffId, schoolId, staffType: 'teaching' } });
    if (!teacher) return sendError(res, 'Teaching staff not found', 404);

    const assignment = await TeacherSubjectAssignment.create({
      schoolId, subjectId, staffId, sectionId, sessionId, assignedBy,
    });

    const result = await TeacherSubjectAssignment.findByPk(assignment.id, {
      include: [
        { association: 'teacher', attributes: ['id', 'name'] },
        { association: 'subject', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] },
      ],
    });

    return sendSuccess(res, result, 'Teacher assigned successfully', 201);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'A teacher is already assigned to this subject for this section and session', 400);
    }
    logger.error('Error creating assignment', { error });
    return sendError(res, 'Failed to create assignment', 500);
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { subjectId, sectionId, sessionId, staffId } = req.query;

    const where: any = { schoolId };
    if (subjectId) where.subjectId = parseInt(String(subjectId));
    if (sectionId) where.sectionId = parseInt(String(sectionId));
    if (sessionId) where.sessionId = parseInt(String(sessionId));
    if (staffId) where.staffId = parseInt(String(staffId));

    const assignments = await TeacherSubjectAssignment.findAll({
      where,
      include: [
        { association: 'teacher', attributes: ['id', 'name'] },
        { association: 'subject', attributes: ['id', 'name', 'classId', 'sessionId'] },
        { association: 'section', attributes: ['id', 'name'] },
      ],
    });
    return sendSuccess(res, assignments, 'Assignments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching assignments', { error });
    return sendError(res, 'Failed to fetch assignments', 500);
  }
};

// GET /academic/my-assignments — the logged-in teacher's subject/section pairs
export const getMyAssignments = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const staffId = requireStaffId(req);

    const session = req.query.sessionId
      ? await AcademicSession.findOne({ where: { id: parseInt(String(req.query.sessionId)), schoolId } })
      : await AcademicSession.findOne({ where: { schoolId, isActive: true } });
    if (!session) return sendSuccess(res, { session: null, assignments: [] }, 'No active academic session');

    const assignments = await TeacherSubjectAssignment.findAll({
      where: { schoolId, staffId, sessionId: session.id },
      attributes: ['id', 'sessionId', 'subjectId', 'sectionId'],
      include: [
        {
          association: 'subject',
          attributes: ['id', 'name', 'classId'],
          include: [{ association: 'class', attributes: ['id', 'name', 'sequence'] }],
        },
        { association: 'section', attributes: ['id', 'name'] },
      ],
    });

    const result = (assignments as any[])
      .map(a => ({
        id: a.id,
        sessionId: a.sessionId,
        subject: { id: a.subject.id, name: a.subject.name },
        class: a.subject.class
          ? { id: a.subject.class.id, name: a.subject.class.name, sequence: a.subject.class.sequence }
          : { id: a.subject.classId, name: '', sequence: null },
        section: { id: a.section.id, name: a.section.name },
      }))
      .sort((a, b) =>
        (a.class.sequence ?? Number.MAX_SAFE_INTEGER) - (b.class.sequence ?? Number.MAX_SAFE_INTEGER) ||
        a.class.name.localeCompare(b.class.name) ||
        a.section.name.localeCompare(b.section.name) ||
        a.subject.name.localeCompare(b.subject.name));

    if (req.query.include === 'progress' && result.length > 0) {
      // Exams relevant to each assignment: exam-event papers + all-section tests + this section's tests
      const exams = await Exam.findAll({
        where: { schoolId, subjectId: { [Op.in]: Array.from(new Set(result.map(a => a.subject.id))) } },
        attributes: ['id', 'subjectId', 'sectionId', 'examEventId'],
      });
      const sectionIds = Array.from(new Set(result.map(a => a.section.id)));
      const enrolled = new Map<number, number[]>();
      for (const sid of sectionIds) enrolled.set(sid, await enrolledStudentIds(schoolId, sid, session.id));

      for (const a of result as any[]) {
        const relevant = exams.filter(e => e.subjectId === a.subject.id && (e.sectionId === null || e.sectionId === a.section.id));
        const students = enrolled.get(a.section.id) ?? [];
        const entered = await enteredCountsByExam(relevant.map(e => e.id), students);
        a.progress = {
          examCount: relevant.length,
          classTestCount: relevant.filter(e => !e.examEventId).length,
          pendingExamCount: students.length === 0 ? 0 : relevant.filter(e => (entered.get(e.id) ?? 0) < students.length).length,
        };
      }
    }

    return sendSuccess(res, { session: { id: session.id, name: session.name }, assignments: result }, 'Assignments retrieved successfully');
  } catch (error) {
    return handleError(res, error, 'Failed to fetch assignments');
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));

    const assignment = await TeacherSubjectAssignment.findOne({ where: { id: parseInt(id), schoolId } });
    if (!assignment) return sendError(res, 'Assignment not found', 404);

    await assignment.destroy();
    return sendSuccess(res, null, 'Assignment removed successfully');
  } catch (error) {
    logger.error('Error deleting assignment', { error });
    return sendError(res, 'Failed to delete assignment', 500);
  }
};

// ─── CHAPTERS ────────────────────────────────────────────────────────────────

export const createChapter = async (req: Request, res: Response) => {
  try {
    const { subjectId, name, orderNumber } = req.body;
    const schoolId = parseInt(String(req.schoolId));

    if (!subjectId || !name) {
      return sendError(res, 'subjectId and name are required', 400);
    }

    const subject = await Subject.findOne({ where: { id: subjectId, schoolId } });
    if (!subject) return sendError(res, 'Subject not found', 404);

    const chapter = await Chapter.create({
      subjectId, schoolId, name: name.trim(),
      orderNumber: orderNumber || 1,
    });
    return sendSuccess(res, chapter, 'Chapter created successfully', 201);
  } catch (error) {
    logger.error('Error creating chapter', { error });
    return sendError(res, 'Failed to create chapter', 500);
  }
};

export const getChapters = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { subjectId } = req.query;

    if (!subjectId) return sendError(res, 'subjectId is required', 400);

    const chapters = await Chapter.findAll({
      where: { subjectId: parseInt(String(subjectId)), schoolId },
      order: [['orderNumber', 'ASC'], ['name', 'ASC']],
    });
    return sendSuccess(res, chapters, 'Chapters retrieved successfully');
  } catch (error) {
    logger.error('Error fetching chapters', { error });
    return sendError(res, 'Failed to fetch chapters', 500);
  }
};

export const updateChapter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));
    const { name, orderNumber, isTaught, taughtOn } = req.body;

    const chapter = await Chapter.findOne({ where: { id: parseInt(id), schoolId } });
    if (!chapter) return sendError(res, 'Chapter not found', 404);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;
    if (isTaught !== undefined) {
      updateData.isTaught = isTaught;
      if (isTaught) {
        updateData.taughtOn = taughtOn || todayISO();
        if (isTeacher(req)) {
          updateData.taughtBy = req.staffId;
        }
      } else {
        updateData.taughtOn = null;
        updateData.taughtBy = null;
      }
    }

    await chapter.update(updateData);
    return sendSuccess(res, chapter, 'Chapter updated successfully');
  } catch (error) {
    logger.error('Error updating chapter', { error });
    return sendError(res, 'Failed to update chapter', 500);
  }
};

export const deleteChapter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));

    const chapter = await Chapter.findOne({ where: { id: parseInt(id), schoolId } });
    if (!chapter) return sendError(res, 'Chapter not found', 404);

    await chapter.destroy();
    return sendSuccess(res, null, 'Chapter deleted successfully');
  } catch (error) {
    logger.error('Error deleting chapter', { error });
    return sendError(res, 'Failed to delete chapter', 500);
  }
};

export const uploadChapterPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));

    const chapter = await Chapter.findOne({ where: { id: parseInt(id), schoolId } });
    if (!chapter) return sendError(res, 'Chapter not found', 404);

    if (!req.file) return sendError(res, 'No PDF file provided', 400);

    const uploadOptions = chapterPDFUploadOptions(chapter.id);
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
      stream.end(req.file!.buffer);
    });

    await chapter.update({ pdfUrl: result.secure_url });
    return sendSuccess(res, { pdfUrl: result.secure_url }, 'PDF uploaded successfully');
  } catch (error) {
    logger.error('Error uploading chapter PDF', { error });
    return sendError(res, 'Failed to upload PDF', 500);
  }
};

export const deleteChapterPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));

    const chapter = await Chapter.findOne({ where: { id: parseInt(id), schoolId } });
    if (!chapter) return sendError(res, 'Chapter not found', 404);

    if (!chapter.pdfUrl) return sendError(res, 'No PDF to delete', 404);

    const publicId = `al-sufiaan-school/chapter-pdfs/chapter-${chapter.id}`;
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    await chapter.update({ pdfUrl: null });
    return sendSuccess(res, null, 'PDF deleted successfully');
  } catch (error) {
    logger.error('Error deleting chapter PDF', { error });
    return sendError(res, 'Failed to delete PDF', 500);
  }
};

// ─── EXAM EVENTS ─────────────────────────────────────────────────────────────

export const createExamEvent = async (req: Request, res: Response) => {
  try {
    const { sessionId, name } = req.body;
    const schoolId = parseInt(String(req.schoolId));
    const createdBy = parseInt(String(req.userId));

    if (!sessionId || !name) {
      return sendError(res, 'sessionId and name are required', 400);
    }

    const event = await ExamEvent.create({ sessionId, name: name.trim(), schoolId, createdBy });
    return sendSuccess(res, event, 'Exam event created successfully', 201);
  } catch (error) {
    logger.error('Error creating exam event', { error });
    return sendError(res, 'Failed to create exam event', 500);
  }
};

export const getExamEvents = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { sessionId } = req.query;

    if (!sessionId) return sendError(res, 'sessionId is required', 400);

    const events = await ExamEvent.findAll({
      where: { sessionId: parseInt(String(sessionId)), schoolId },
      include: [{ association: 'subjectExams', attributes: ['id'] }],
      order: [['createdAt', 'ASC']],
    });

    // An event is school-wide, but each class sets up its own papers under it.
    // classIds = classes that have at least one paper for the event.
    const papers = events.length
      ? await Exam.findAll({
          where: { schoolId, examEventId: { [Op.in]: events.map(e => e.id) } },
          attributes: ['examEventId'],
          include: [{ association: 'subject', attributes: ['classId'] }],
        })
      : [];
    const classIdsByEvent = new Map<number, Set<number>>();
    for (const paper of papers as any[]) {
      if (!classIdsByEvent.has(paper.examEventId)) classIdsByEvent.set(paper.examEventId, new Set());
      classIdsByEvent.get(paper.examEventId)!.add(paper.subject.classId);
    }

    const result = events.map(e => ({ ...e.toJSON(), classIds: Array.from(classIdsByEvent.get(e.id) ?? []) }));
    return sendSuccess(res, result, 'Exam events retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam events', { error });
    return sendError(res, 'Failed to fetch exam events', 500);
  }
};

export const updateExamEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));
    const { name } = req.body;

    const event = await ExamEvent.findOne({ where: { id: parseInt(id), schoolId } });
    if (!event) return sendError(res, 'Exam event not found', 404);

    await event.update({ name: name.trim() });
    return sendSuccess(res, event, 'Exam event updated successfully');
  } catch (error) {
    logger.error('Error updating exam event', { error });
    return sendError(res, 'Failed to update exam event', 500);
  }
};

export const deleteExamEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));

    const event = await ExamEvent.findOne({ where: { id: parseInt(id), schoolId } });
    if (!event) return sendError(res, 'Exam event not found', 404);

    await event.destroy();
    return sendSuccess(res, null, 'Exam event deleted successfully');
  } catch (error) {
    logger.error('Error deleting exam event', { error });
    return sendError(res, 'Failed to delete exam event', 500);
  }
};

// ─── EXAMS ───────────────────────────────────────────────────────────────────

const MAX_TOTAL_MARKS = 1000;

/** Validates total/passing marks; returns an error message or null. */
const validateMarksConfig = (totalMarks: unknown, passingMarks: unknown): string | null => {
  const total = Number(totalMarks);
  const passing = Number(passingMarks);
  if (!Number.isInteger(total) || total < 1 || total > MAX_TOTAL_MARKS) {
    return `Total marks must be a whole number between 1 and ${MAX_TOTAL_MARKS}`;
  }
  if (!Number.isInteger(passing) || passing < 0) return 'Passing marks must be a whole number';
  if (passing > total) return 'Passing marks cannot exceed total marks';
  return null;
};

/** Every chapter must belong to the exam's subject. */
const assertChaptersBelongToSubject = async (chapterIds: unknown, subjectId: number, schoolId: number) => {
  if (!Array.isArray(chapterIds) || chapterIds.length === 0) return;
  const ids = Array.from(new Set(chapterIds.map(Number)));
  const found = await Chapter.count({ where: { id: { [Op.in]: ids }, subjectId, schoolId } });
  if (found !== ids.length) throw new HttpError(400, 'Some chapters do not belong to this subject');
};

/** Marks entered so far (absent counts as entered). */
const countEnteredMarks = (examId: number) =>
  StudentExamMark.count({
    where: { examId, [Op.or]: [{ isAbsent: true }, { marksObtained: { [Op.ne]: null } }] },
  });

/**
 * A teacher may change a class test they created, or one in a section where
 * they currently teach the subject. Exam-event papers and all-section (legacy)
 * tests stay with the office.
 */
const assertTeacherCanManageExam = async (req: Request, exam: Exam, subject: Subject) => {
  if (!isTeacher(req)) return;
  if (exam.examEventId) throw new HttpError(403, 'Exam papers for exam events are managed by the school office');
  if (!exam.sectionId) throw new HttpError(403, 'This test is for the whole class — ask the school office to change it');
  if (exam.createdBy === parseInt(String(req.userId))) return;
  await assertTeacherAssignment(req, { subjectId: subject.id, sectionId: exam.sectionId, sessionId: subject.sessionId });
};

/** Active students enrolled in a section for a session. */
const enrolledStudentIds = async (schoolId: number, sectionId: number, sessionId: number) => {
  const rows = await StudentEnrollment.findAll({
    where: { sectionId, sessionId },
    attributes: ['studentId'],
    include: [{ association: 'student', attributes: [], where: { schoolId, active: true }, required: true }],
  });
  return rows.map(r => r.studentId);
};

/** examId → number of those students with a mark or absent entered. */
const enteredCountsByExam = async (examIds: number[], studentIds: number[]) => {
  if (examIds.length === 0 || studentIds.length === 0) return new Map<number, number>();
  const rows = (await StudentExamMark.findAll({
    where: {
      examId: { [Op.in]: examIds },
      studentId: { [Op.in]: studentIds },
      [Op.or]: [{ isAbsent: true }, { marksObtained: { [Op.ne]: null } }],
    },
    attributes: ['examId', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
    group: ['examId'],
    raw: true,
  })) as unknown as { examId: number; cnt: number }[];
  return new Map(rows.map(r => [r.examId, Number(r.cnt)]));
};

export const createExam = async (req: Request, res: Response) => {
  try {
    const { subjectId, examEventId, name, totalMarks, passingMarks, examDate, chapterIds } = req.body;
    const sectionId = req.body.sectionId ? parseInt(String(req.body.sectionId)) : null;
    const schoolId = parseInt(String(req.schoolId));
    const createdBy = parseInt(String(req.userId));

    if (!subjectId || totalMarks === undefined || passingMarks === undefined) {
      return sendError(res, 'subjectId, totalMarks, and passingMarks are required', 400);
    }
    const marksError = validateMarksConfig(totalMarks, passingMarks);
    if (marksError) return sendError(res, marksError, 400);
    if (examDate && !isISODate(examDate)) return sendError(res, 'examDate must be in YYYY-MM-DD format', 400);
    if (examEventId && sectionId) return sendError(res, 'Exam-event papers apply to all sections', 400);

    const subject = await Subject.findOne({ where: { id: subjectId, schoolId } });
    if (!subject) return sendError(res, 'Subject not found', 404);

    if (isTeacher(req)) {
      if (examEventId) return sendError(res, 'Exam papers for exam events are set up by the school office', 403);
      if (!sectionId) return sendError(res, 'sectionId is required', 400);
    }
    if (sectionId) {
      const section = await Section.findOne({ where: { id: sectionId, classId: subject.classId } });
      if (!section) return sendError(res, 'Section does not belong to this class', 400);
      await assertTeacherAssignment(req, { subjectId: subject.id, sectionId, sessionId: subject.sessionId });
    }
    await assertChaptersBelongToSubject(chapterIds, subject.id, schoolId);

    // For exam event subjects, auto-populate name from event
    let examName = name ? String(name).trim() : null;
    if (examEventId) {
      const event = await ExamEvent.findOne({ where: { id: examEventId, schoolId } });
      if (!event) return sendError(res, 'Exam event not found', 404);
      if (!examName) examName = event.name;
    } else if (!examName) {
      return sendError(res, 'name is required for class tests', 400);
    }
    if (examName!.length > 100) return sendError(res, 'Name must be 100 characters or fewer', 400);

    const exam = await Exam.create({
      subjectId, examEventId: examEventId || null, sectionId, schoolId,
      name: examName, totalMarks: Number(totalMarks), passingMarks: Number(passingMarks),
      examDate: examDate || null, createdBy,
    });

    if (Array.isArray(chapterIds) && chapterIds.length > 0) {
      await ExamChapter.bulkCreate(
        chapterIds.map((cid: number) => ({ examId: exam.id, chapterId: cid, schoolId })),
        { ignoreDuplicates: true }
      );
    }

    return sendSuccess(res, exam, 'Exam created successfully', 201);
  } catch (error) {
    return handleError(res, error, 'Failed to create exam');
  }
};

// GET /exams?subjectId|examEventId[&sectionId][&withProgress=true&sessionId]
// With sectionId, returns that section's class tests plus all-section exams.
export const getExams = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { subjectId, examEventId, sectionId, sessionId, withProgress } = req.query;

    const where: any = { schoolId };
    if (subjectId) where.subjectId = parseInt(String(subjectId));
    if (examEventId) where.examEventId = parseInt(String(examEventId));
    if (sectionId) where[Op.or] = [{ sectionId: parseInt(String(sectionId)) }, { sectionId: null }];

    if (!subjectId && !examEventId) {
      return sendError(res, 'subjectId or examEventId is required', 400);
    }

    const exams = await Exam.findAll({
      where,
      include: [
        { association: 'examEvent', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] },
        {
          association: 'examChapters',
          attributes: ['id', 'examId', 'chapterId'],
          include: [{ association: 'chapter', attributes: ['id', 'name', 'orderNumber'] }],
        },
      ],
      order: [['examDate', 'ASC'], ['name', 'ASC']],
    });

    if (withProgress === 'true' && sectionId && sessionId) {
      const studentIds = await enrolledStudentIds(schoolId, parseInt(String(sectionId)), parseInt(String(sessionId)));
      const entered = await enteredCountsByExam(exams.map(e => e.id), studentIds);
      const withCounts = exams.map(e => ({
        ...e.toJSON(),
        progress: { enrolled: studentIds.length, entered: entered.get(e.id) ?? 0 },
      }));
      return sendSuccess(res, withCounts, 'Exams retrieved successfully');
    }

    return sendSuccess(res, exams, 'Exams retrieved successfully');
  } catch (error) {
    return handleError(res, error, 'Failed to fetch exams');
  }
};

export const updateExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));
    const { name, totalMarks, passingMarks, examDate, chapterIds } = req.body;

    const exam = await Exam.findOne({ where: { id: parseInt(id), schoolId }, include: [{ association: 'subject' }] });
    if (!exam) return sendError(res, 'Exam not found', 404);
    const subject = (exam as any).subject as Subject;
    await assertTeacherCanManageExam(req, exam, subject);

    const newTotal = totalMarks !== undefined ? Number(totalMarks) : exam.totalMarks;
    const newPassing = passingMarks !== undefined ? Number(passingMarks) : exam.passingMarks;
    const marksError = validateMarksConfig(newTotal, newPassing);
    if (marksError) return sendError(res, marksError, 400);
    if (examDate && !isISODate(examDate)) return sendError(res, 'examDate must be in YYYY-MM-DD format', 400);
    if (name !== undefined && (!String(name).trim() || String(name).trim().length > 100)) {
      return sendError(res, 'Name is required (100 characters or fewer)', 400);
    }

    if (newTotal < exam.totalMarks) {
      const highest = await StudentExamMark.max('marksObtained', { where: { examId: exam.id } });
      if (highest !== null && Number(highest) > newTotal) {
        return sendError(res, `Total marks can't be below the highest mark already entered (${Number(highest)})`, 400);
      }
    }
    await assertChaptersBelongToSubject(chapterIds, exam.subjectId, schoolId);

    await exam.update({
      name: name !== undefined ? String(name).trim() : exam.name,
      totalMarks: newTotal,
      passingMarks: newPassing,
      examDate: examDate !== undefined ? examDate || null : exam.examDate,
    });

    if (Array.isArray(chapterIds)) {
      await ExamChapter.destroy({ where: { examId: exam.id } });
      if (chapterIds.length > 0) {
        await ExamChapter.bulkCreate(
          chapterIds.map((cid: number) => ({ examId: exam.id, chapterId: cid, schoolId })),
          { ignoreDuplicates: true }
        );
      }
    }

    const { subject: _subject, ...plain } = exam.toJSON() as any;
    return sendSuccess(res, plain, 'Exam updated successfully');
  } catch (error) {
    return handleError(res, error, 'Failed to update exam');
  }
};

// DELETE /exams/:id[?force=true] — teachers must confirm when marks exist (409 otherwise)
export const deleteExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));

    const exam = await Exam.findOne({ where: { id: parseInt(id), schoolId }, include: [{ association: 'subject' }] });
    if (!exam) return sendError(res, 'Exam not found', 404);
    await assertTeacherCanManageExam(req, exam, (exam as any).subject);

    if (isTeacher(req) && req.query.force !== 'true') {
      const markCount = await countEnteredMarks(exam.id);
      if (markCount > 0) {
        return sendError(res, `This test has marks for ${markCount} student(s). Delete anyway?`, 409, { markCount });
      }
    }

    await exam.destroy();
    return sendSuccess(res, null, 'Exam deleted successfully');
  } catch (error) {
    return handleError(res, error, 'Failed to delete exam');
  }
};

// ─── MARKS ───────────────────────────────────────────────────────────────────

export const bulkSubmitMarks = async (req: Request, res: Response) => {
  try {
    const { examId, marks } = req.body;
    const schoolId = parseInt(String(req.schoolId));
    const enteredBy = parseInt(String(req.userId));

    if (!examId || !Array.isArray(marks) || marks.length === 0) {
      return sendError(res, 'examId and marks array are required', 400);
    }

    const exam = await Exam.findOne({
      where: { id: examId, schoolId },
      include: [{ association: 'subject', attributes: ['id', 'classId', 'sessionId'] }],
    });
    if (!exam) return sendError(res, 'Exam not found', 404);
    const subject = (exam as any).subject as Subject;

    // Validate every row; one entry per student (last one wins).
    // marksObtained null/undefined means "not entered yet".
    const byStudent = new Map<number, { marksObtained: number | null; isAbsent: boolean }>();
    const invalid: { studentId: unknown; reason: string }[] = [];
    for (const m of marks as { studentId: unknown; marksObtained?: unknown; isAbsent?: unknown }[]) {
      const studentId = Number(m.studentId);
      if (!Number.isInteger(studentId) || studentId <= 0) {
        invalid.push({ studentId: m.studentId, reason: 'Invalid studentId' });
        continue;
      }
      const isAbsent = m.isAbsent === true;
      let marksObtained: number | null = null;
      if (!isAbsent && m.marksObtained !== null && m.marksObtained !== undefined && m.marksObtained !== '') {
        marksObtained = Number(m.marksObtained);
        if (!Number.isFinite(marksObtained) || marksObtained < 0 || marksObtained > exam.totalMarks) {
          invalid.push({ studentId, reason: `Marks must be between 0 and ${exam.totalMarks}` });
          continue;
        }
        if (Math.round(marksObtained * 100) !== marksObtained * 100) {
          invalid.push({ studentId, reason: 'Marks can have at most 2 decimal places' });
          continue;
        }
      }
      byStudent.set(studentId, { marksObtained, isAbsent });
    }
    if (invalid.length > 0) {
      return sendError(res, `${invalid.length} mark(s) are invalid`, 400, { invalid });
    }

    // Every student must be enrolled in the exam's class; teachers must teach
    // this subject in each section the students belong to.
    const requestedSection = req.body.sectionId ? parseInt(String(req.body.sectionId)) : null;
    if (exam.sectionId && requestedSection && requestedSection !== exam.sectionId) {
      return sendError(res, 'This test belongs to a different section', 400);
    }
    const studentIds = Array.from(byStudent.keys());
    const enrollments = await resolveEnrollments(schoolId, studentIds, {
      sessionId: subject.sessionId,
      classId: subject.classId,
      sectionId: exam.sectionId ?? requestedSection,
    });
    if (isTeacher(req)) {
      const sectionIds = new Set(Array.from(enrollments.values()).map(e => e.sectionId));
      for (const sectionId of sectionIds) {
        await assertTeacherAssignment(req, { subjectId: subject.id, sectionId, sessionId: subject.sessionId });
      }
    }

    const now = new Date();
    const records = studentIds.map(studentId => ({
      examId: exam.id,
      studentId,
      schoolId,
      marksObtained: byStudent.get(studentId)!.marksObtained,
      isAbsent: byStudent.get(studentId)!.isAbsent,
      enteredBy,
      enteredAt: now,
    }));

    await StudentExamMark.bulkCreate(records, {
      updateOnDuplicate: ['marksObtained', 'isAbsent', 'enteredBy', 'enteredAt', 'updatedAt'],
    });

    return sendSuccess(res, { saved: records.length }, `Marks saved for ${records.length} students`);
  } catch (error) {
    return handleError(res, error, 'Failed to submit marks');
  }
};

export const getMarksByExam = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { examId, sectionId, sessionId } = req.query;

    if (!examId) return sendError(res, 'examId is required', 400);

    const exam = await Exam.findOne({ where: { id: parseInt(String(examId)), schoolId } });
    if (!exam) return sendError(res, 'Exam not found', 404);

    // With section + session context, return one row per enrolled student
    // (whether or not marks have been entered yet) so the marks-entry sheet
    // always lists the full roster.
    if (sectionId && sessionId) {
      const enrollments = await StudentEnrollment.findAll({
        where: { sectionId: parseInt(String(sectionId)), sessionId: parseInt(String(sessionId)) },
        attributes: ['studentId', 'rollNumber'],
        include: [{
          association: 'student',
          attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'fatherName', 'studentPhoto'],
          where: { schoolId, active: true },
          required: true,
        }],
      });
      enrollments.sort(byRollThenName(
        (e: any) => e.rollNumber,
        (e: any) => `${e.student.firstName} ${e.student.lastName}`,
      ));

      const existingMarks = await StudentExamMark.findAll({
        where: { examId: parseInt(String(examId)) },
        include: [{ association: 'enteredByUser', attributes: ['id', 'firstName', 'lastName'] }],
      });
      const markByStudent = new Map(existingMarks.map(m => [m.studentId, m] as const));

      const rows = enrollments.map((e: any) => {
        const student = {
          ...e.student.toJSON(),
          enrollments: [{ rollNumber: e.rollNumber }],
        };
        const mark = markByStudent.get(e.studentId);
        if (mark) return { ...mark.toJSON(), student };
        return {
          id: null,
          examId: parseInt(String(examId)),
          studentId: e.studentId,
          schoolId,
          marksObtained: null,
          isAbsent: false,
          enteredBy: null,
          enteredAt: null,
          student,
          enteredByUser: null,
        };
      });

      return sendSuccess(res, rows, 'Marks retrieved successfully');
    }

    const marks = await StudentExamMark.findAll({
      where: { examId: parseInt(String(examId)) },
      include: [
        {
          association: 'student',
          attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'fatherName', 'studentPhoto'],
        },
        { association: 'enteredByUser', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [[{ model: Student, as: 'student' }, 'firstName', 'ASC']],
    });

    return sendSuccess(res, marks, 'Marks retrieved successfully');
  } catch (error) {
    logger.error('Error fetching marks by exam', { error });
    return sendError(res, 'Failed to fetch marks', 500);
  }
};

export const getStudentMarks = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { studentId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) return sendError(res, 'sessionId is required', 400);

    const student = await Student.findOne({ where: { id: parseInt(studentId), schoolId } });
    if (!student) return sendError(res, 'Student not found', 404);

    // Get the student's class for this session
    const enrollment = await StudentEnrollment.findOne({
      where: { studentId: parseInt(studentId), sessionId: parseInt(String(sessionId)) },
    });
    if (!enrollment) return sendSuccess(res, [], 'No enrollment found for this session');

    // Get all subjects for this session + class, with exams and this student's marks
    // (class tests from other sections are excluded)
    const subjects = await Subject.findAll({
      where: { sessionId: parseInt(String(sessionId)), schoolId, classId: enrollment.classId },
      include: [
        {
          association: 'exams',
          required: false,
          where: { [Op.or]: [{ sectionId: null }, { sectionId: enrollment.sectionId }] },
          include: [
            {
              association: 'marks',
              where: { studentId: parseInt(studentId) },
              required: false,
            },
            { association: 'examEvent', attributes: ['id', 'name'] },
          ],
        },
      ],
      order: [['name', 'ASC']],
    });

    return sendSuccess(res, subjects, 'Student marks retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student marks', { error });
    return sendError(res, 'Failed to fetch student marks', 500);
  }
};

// ─── REPORT CARDS ────────────────────────────────────────────────────────────

export const getEventReportCard = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { examEventId, classId, sectionId, sessionId } = req.query;

    if (!examEventId || !classId || !sectionId || !sessionId) {
      return sendError(res, 'examEventId, classId, sectionId, and sessionId are required', 400);
    }

    const event = await ExamEvent.findOne({ where: { id: parseInt(String(examEventId)), schoolId } });
    if (!event) return sendError(res, 'Exam event not found', 404);

    const section = await Section.findOne({ where: { id: parseInt(String(sectionId)), classId: parseInt(String(classId)) } });
    if (!section) return sendError(res, 'Section does not belong to this class', 400);
    // Teachers see report cards only for sections they teach
    await assertTeacherInSection(req, { sectionId: section.id, sessionId: parseInt(String(sessionId)) });

    // Get enrolled students for this section+session
    const enrollments = await StudentEnrollment.findAll({
      where: {
        classId: parseInt(String(classId)),
        sectionId: parseInt(String(sectionId)),
        sessionId: parseInt(String(sessionId)),
      },
      include: [{
        association: 'student',
        attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'fatherName', 'studentPhoto'],
        where: { schoolId, active: true },
        required: true,
      }],
      order: [['rollNumber', 'ASC']],
    });

    const [cls, sec, session] = await Promise.all([
      Class.findByPk(parseInt(String(classId)), { attributes: ['id', 'name'] }),
      Section.findByPk(parseInt(String(sectionId)), { attributes: ['id', 'name'] }),
      AcademicSession.findByPk(parseInt(String(sessionId)), { attributes: ['id', 'name'] }),
    ]);

    const students = enrollments
      .map((e: any) => ({
        studentId: e.student.id,
        studentName: `${e.student.firstName} ${e.student.lastName}`.trim(),
        admissionNumber: e.student.admissionNumber,
        rollNumber: e.rollNumber,
        fatherName: e.student.fatherName ?? null,
        studentPhoto: e.student.studentPhoto ?? null,
      }))
      .sort(byRollThenName(s => s.rollNumber, s => s.studentName));

    const studentIds = students.map((s: any) => s.studentId);

    // Get all exams for this event that belong to subjects of the given class
    const exams = await Exam.findAll({
      where: { examEventId: parseInt(String(examEventId)), schoolId },
      include: [
        {
          association: 'subject',
          attributes: ['id', 'name'],
          where: { classId: parseInt(String(classId)) },
          required: true,
        },
        {
          association: 'marks',
          where: { studentId: { [Op.in]: studentIds } },
          required: false,
          include: [{ association: 'student', attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
      order: [[{ model: Subject, as: 'subject' }, 'name', 'ASC']],
    });

    const subjects = (exams as any[]).map(exam => ({
      subjectId: exam.subject.id,
      subjectName: exam.subject.name,
      examId: exam.id,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      examDate: exam.examDate,
      marks: students.map((s: any) => {
        const mark = exam.marks?.find((m: any) => m.studentId === s.studentId);
        const marksObtained = mark && mark.marksObtained !== null ? Number(mark.marksObtained) : null;
        return {
          studentId: s.studentId,
          studentName: s.studentName,
          admissionNumber: s.admissionNumber,
          rollNumber: s.rollNumber,
          marksObtained,
          isAbsent: mark ? mark.isAbsent : false,
          grade: marksObtained !== null && exam.totalMarks > 0 ? gradeFor((marksObtained / exam.totalMarks) * 100) : null,
        };
      }),
    }));

    const summaries = computeEventSummaries(studentIds, subjects);
    const ranked = summaries.filter(s => s.percentage !== null);
    const classStats = {
      studentsWithMarks: ranked.length,
      highestPercentage: ranked.length ? Math.max(...ranked.map(s => s.percentage!)) : null,
      averagePercentage: ranked.length ? ranked.reduce((sum, s) => sum + s.percentage!, 0) / ranked.length : null,
    };

    return sendSuccess(res, {
      examEvent: event, class: cls, section: sec, session, students, subjects,
      summaries, classStats, gradeScale: GRADE_SCALE,
    }, 'Event report card retrieved successfully');
  } catch (error) {
    return handleError(res, error, 'Failed to fetch event report card');
  }
};

export const getAnnualReportCard = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { studentId, sessionId } = req.query;

    if (!studentId || !sessionId) {
      return sendError(res, 'studentId and sessionId are required', 400);
    }

    const student = await Student.findOne({
      where: { id: parseInt(String(studentId)), schoolId },
      attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'studentPhoto'],
    });
    if (!student) return sendError(res, 'Student not found', 404);

    const enrollment = await StudentEnrollment.findOne({
      where: { studentId: parseInt(String(studentId)), sessionId: parseInt(String(sessionId)) },
      include: [
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] },
      ],
    });
    if (!enrollment) return sendSuccess(res, { student, subjects: [] }, 'No enrollment found for this session');

    // Get all exam events for this session (ordered by creation)
    const examEvents = await ExamEvent.findAll({
      where: { sessionId: parseInt(String(sessionId)), schoolId },
      order: [['createdAt', 'ASC']],
    });

    // Get all subjects for this student's class+session (own section's class tests only)
    const subjects = await Subject.findAll({
      where: { sessionId: parseInt(String(sessionId)), schoolId, classId: (enrollment as any).classId },
      include: [
        {
          association: 'exams',
          required: false,
          where: { [Op.or]: [{ sectionId: null }, { sectionId: (enrollment as any).sectionId }] },
          include: [
            {
              association: 'marks',
              where: { studentId: parseInt(String(studentId)) },
              required: false,
            },
            { association: 'examEvent', attributes: ['id', 'name'] },
          ],
        },
      ],
      order: [['name', 'ASC']],
    });

    // Only events that have papers set up for this class
    const eventIdsForClass = new Set((subjects as any[]).flatMap(s => s.exams.map((e: any) => e.examEventId)).filter(Boolean));
    const classEvents = examEvents.filter(e => eventIdsForClass.has(e.id));

    const result = (subjects as any[]).map(subject => {
      const classTests = subject.exams.filter((e: any) => !e.examEventId);
      const classTestMarks = classTests.filter((e: any) => e.marks?.[0] && !e.marks[0].isAbsent && e.marks[0].marksObtained !== null);
      const classTestObtained = classTestMarks.reduce((sum: number, e: any) => sum + Number(e.marks[0].marksObtained), 0);
      const classTestTotal = classTestMarks.reduce((sum: number, e: any) => sum + e.totalMarks, 0);
      const classTestAvgPct = classTestTotal > 0 ? Math.round((classTestObtained / classTestTotal) * 100) : null;

      const eventResults = classEvents.map((event: any) => {
        const exam = subject.exams.find((e: any) => e.examEventId === event.id);
        if (!exam) return { eventId: event.id, eventName: event.name, marksObtained: null, totalMarks: null, passingMarks: null, isAbsent: false, examDate: null };
        const mark = exam.marks?.[0] || null;
        return {
          eventId: event.id,
          eventName: event.name,
          examId: exam.id,
          marksObtained: mark && mark.marksObtained !== null ? Number(mark.marksObtained) : null,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          isAbsent: mark ? mark.isAbsent : false,
          examDate: exam.examDate,
        };
      });

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        classTestAvg: {
          count: classTests.length,
          obtained: classTestObtained,
          total: classTestTotal,
          percentage: classTestAvgPct,
        },
        examEvents: eventResults,
      };
    });

    return sendSuccess(res, {
      student,
      enrollment: {
        class: (enrollment as any).class,
        section: (enrollment as any).section,
        rollNumber: (enrollment as any).rollNumber,
      },
      examEvents: classEvents.map((e: any) => ({ id: e.id, name: e.name })),
      subjects: result,
    }, 'Annual report card retrieved successfully');
  } catch (error) {
    logger.error('Error fetching annual report card', { error });
    return sendError(res, 'Failed to fetch annual report card', 500);
  }
};

// ─── SYLLABUS PROGRESS ───────────────────────────────────────────────────────

export const getSyllabusProgress = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { classId, sessionId } = req.query;

    if (!classId || !sessionId) {
      return sendError(res, 'classId and sessionId are required', 400);
    }

    const subjects = await Subject.findAll({
      where: { schoolId, classId: Number(classId), sessionId: Number(sessionId) },
      include: [
        {
          model: Chapter,
          as: 'chapters',
          attributes: ['id', 'name', 'orderNumber', 'isTaught', 'taughtOn'],
        },
      ],
      order: [['name', 'ASC'], [{ model: Chapter, as: 'chapters' }, 'orderNumber', 'ASC']],
    });

    const result = (subjects as any[]).map(subject => {
      const chapters = subject.chapters || [];
      const total = chapters.length;
      const taught = chapters.filter((c: any) => c.isTaught).length;
      const pct = total > 0 ? Math.round((taught / total) * 100) : 0;
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalChapters: total,
        taughtChapters: taught,
        progressPct: pct,
        chapters: chapters.map((c: any) => ({
          id: c.id,
          name: c.name,
          orderNumber: c.orderNumber,
          isTaught: c.isTaught,
          taughtOn: c.taughtOn,
        })),
      };
    });

    return sendSuccess(res, result, 'Syllabus progress retrieved successfully');
  } catch (error) {
    logger.error('Error fetching syllabus progress', { error });
    return sendError(res, 'Failed to fetch syllabus progress', 500);
  }
};
