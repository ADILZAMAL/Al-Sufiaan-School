import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Subject, Chapter, Exam, ExamEvent, ExamChapter, StudentExamMark, TeacherSubjectAssignment, Student, Staff, User, StudentEnrollment, AcademicSession, Section } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';
import cloudinary, { chapterPDFUploadOptions } from '../config/cloudinary';

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
        updateData.taughtOn = taughtOn || new Date().toISOString().split('T')[0];
        // Look up staffId from userId if teacher role
        if (req.userRole === 'TEACHER') {
          const user = await User.findByPk(parseInt(String(req.userId)), { attributes: ['staffId'] });
          updateData.taughtBy = user ? (user as any).staffId : null;
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
    return sendSuccess(res, events, 'Exam events retrieved successfully');
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

export const createExam = async (req: Request, res: Response) => {
  try {
    const { subjectId, examEventId, name, totalMarks, passingMarks, examDate, chapterIds } = req.body;
    const schoolId = parseInt(String(req.schoolId));
    const createdBy = parseInt(String(req.userId));

    if (!subjectId || totalMarks === undefined || passingMarks === undefined) {
      return sendError(res, 'subjectId, totalMarks, and passingMarks are required', 400);
    }
    if (passingMarks > totalMarks) {
      return sendError(res, 'Passing marks cannot exceed total marks', 400);
    }

    const subject = await Subject.findOne({ where: { id: subjectId, schoolId } });
    if (!subject) return sendError(res, 'Subject not found', 404);

    // For exam event subjects, auto-populate name from event
    let examName = name ? name.trim() : null;
    if (examEventId) {
      const event = await ExamEvent.findOne({ where: { id: examEventId, schoolId } });
      if (!event) return sendError(res, 'Exam event not found', 404);
      if (!examName) examName = event.name;
    } else {
      if (!examName) return sendError(res, 'name is required for class tests', 400);
    }

    const exam = await Exam.create({
      subjectId, examEventId: examEventId || null, schoolId,
      name: examName, totalMarks, passingMarks,
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
    logger.error('Error creating exam', { error });
    return sendError(res, 'Failed to create exam', 500);
  }
};

export const getExams = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { subjectId, examEventId } = req.query;

    const where: any = { schoolId };
    if (subjectId) where.subjectId = parseInt(String(subjectId));
    if (examEventId) where.examEventId = parseInt(String(examEventId));

    if (!subjectId && !examEventId) {
      return sendError(res, 'subjectId or examEventId is required', 400);
    }

    const exams = await Exam.findAll({
      where,
      include: [
        { association: 'examEvent', attributes: ['id', 'name'] },
        {
          association: 'examChapters',
          attributes: [],
          include: [{ association: 'chapter', attributes: ['id', 'name', 'orderNumber'] }],
        },
      ],
      order: [['examDate', 'ASC'], ['name', 'ASC']],
    });
    return sendSuccess(res, exams, 'Exams retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exams', { error });
    return sendError(res, 'Failed to fetch exams', 500);
  }
};

export const updateExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));
    const { name, totalMarks, passingMarks, examDate, chapterIds } = req.body;

    const exam = await Exam.findOne({ where: { id: parseInt(id), schoolId } });
    if (!exam) return sendError(res, 'Exam not found', 404);

    const newTotal = totalMarks !== undefined ? totalMarks : exam.totalMarks;
    const newPassing = passingMarks !== undefined ? passingMarks : exam.passingMarks;
    if (newPassing > newTotal) {
      return sendError(res, 'Passing marks cannot exceed total marks', 400);
    }

    await exam.update({
      name: name !== undefined ? name.trim() : exam.name,
      totalMarks: newTotal,
      passingMarks: newPassing,
      examDate: examDate !== undefined ? examDate : exam.examDate,
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

    return sendSuccess(res, exam, 'Exam updated successfully');
  } catch (error) {
    logger.error('Error updating exam', { error });
    return sendError(res, 'Failed to update exam', 500);
  }
};

export const deleteExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = parseInt(String(req.schoolId));

    const exam = await Exam.findOne({ where: { id: parseInt(id), schoolId } });
    if (!exam) return sendError(res, 'Exam not found', 404);

    await exam.destroy();
    return sendSuccess(res, null, 'Exam deleted successfully');
  } catch (error) {
    logger.error('Error deleting exam', { error });
    return sendError(res, 'Failed to delete exam', 500);
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

    const exam = await Exam.findOne({ where: { id: examId, schoolId } });
    if (!exam) return sendError(res, 'Exam not found', 404);

    const now = new Date();
    const records = marks.map((m: { studentId: number; marksObtained?: number; isAbsent?: boolean }) => ({
      examId,
      studentId: m.studentId,
      schoolId,
      marksObtained: m.isAbsent ? null : (m.marksObtained ?? null),
      isAbsent: m.isAbsent ?? false,
      enteredBy,
      enteredAt: now,
    }));

    await StudentExamMark.bulkCreate(records, {
      updateOnDuplicate: ['marksObtained', 'isAbsent', 'enteredBy', 'enteredAt', 'updatedAt'],
    });

    return sendSuccess(res, null, `Marks saved for ${records.length} students`);
  } catch (error) {
    logger.error('Error submitting marks', { error });
    return sendError(res, 'Failed to submit marks', 500);
  }
};

export const getMarksByExam = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { examId, sectionId, sessionId } = req.query;

    if (!examId) return sendError(res, 'examId is required', 400);

    const exam = await Exam.findOne({ where: { id: parseInt(String(examId)), schoolId } });
    if (!exam) return sendError(res, 'Exam not found', 404);

    const studentInclude: object = {
      association: 'student',
      attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'fatherName', 'studentPhoto'],
      required: !!(sectionId && sessionId),
      include: sectionId && sessionId ? [{
        model: StudentEnrollment,
        as: 'enrollments',
        attributes: ['rollNumber'],
        where: { sectionId: parseInt(String(sectionId)), sessionId: parseInt(String(sessionId)) },
        required: true,
      }] : [],
    };

    const marks = await StudentExamMark.findAll({
      where: { examId: parseInt(String(examId)) },
      include: [
        studentInclude,
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
    const subjects = await Subject.findAll({
      where: { sessionId: parseInt(String(sessionId)), schoolId, classId: enrollment.classId },
      include: [
        {
          association: 'exams',
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

export const getPendingMarks = async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(String(req.schoolId));
    const { classId, sectionId, sessionId } = req.query;

    if (!classId || !sectionId || !sessionId) {
      return sendError(res, 'classId, sectionId, and sessionId are required', 400);
    }

    // Total students enrolled in this class+section+session
    const totalStudents = await StudentEnrollment.count({
      where: {
        classId: parseInt(String(classId)),
        sectionId: parseInt(String(sectionId)),
        sessionId: parseInt(String(sessionId)),
      },
    });

    // All subjects for this class+session, with exams directly
    const subjects = await Subject.findAll({
      where: { classId: parseInt(String(classId)), sessionId: parseInt(String(sessionId)), schoolId },
      include: [
        {
          association: 'exams',
          include: [
            {
              association: 'marks',
              attributes: ['id'],
              required: false,
            },
            { association: 'examEvent', attributes: ['id', 'name'] },
          ],
        },
        {
          association: 'assignments',
          where: { sectionId: parseInt(String(sectionId)), sessionId: parseInt(String(sessionId)) },
          required: false,
          include: [{ association: 'teacher', attributes: ['id', 'name'] }],
        },
      ],
    });

    // Flatten into a list of exams with status
    const result: any[] = [];
    for (const subject of subjects as any[]) {
      const teacher = subject.assignments?.[0]?.teacher || null;
      for (const exam of subject.exams || []) {
        const entered = exam.marks?.length ?? 0;
        let status: string;
        if (entered === 0) status = 'Not started';
        else if (entered < totalStudents) status = `Partial (${entered}/${totalStudents})`;
        else status = 'Complete';

        result.push({
          examId: exam.id,
          examName: exam.name,
          subjectName: subject.name,
          subjectId: subject.id,
          examEventName: exam.examEvent?.name || null,
          totalMarks: exam.totalMarks,
          examDate: exam.examDate,
          teacher,
          totalStudents,
          marksEntered: entered,
          status,
        });
      }
    }

    return sendSuccess(res, result, 'Pending marks retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pending marks', { error });
    return sendError(res, 'Failed to fetch pending marks', 500);
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

    // Get enrolled students for this section+session
    const enrollments = await StudentEnrollment.findAll({
      where: {
        classId: parseInt(String(classId)),
        sectionId: parseInt(String(sectionId)),
        sessionId: parseInt(String(sessionId)),
      },
      include: [{
        association: 'student',
        attributes: ['id', 'firstName', 'lastName', 'admissionNumber'],
      }],
      order: [[{ model: Student, as: 'student' }, 'firstName', 'ASC']],
    });

    const students = enrollments.map((e: any) => ({
      studentId: e.student.id,
      studentName: `${e.student.firstName} ${e.student.lastName}`.trim(),
      admissionNumber: e.student.admissionNumber,
      rollNumber: e.rollNumber,
    }));

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
        return {
          studentId: s.studentId,
          studentName: s.studentName,
          admissionNumber: s.admissionNumber,
          rollNumber: s.rollNumber,
          marksObtained: mark ? mark.marksObtained : null,
          isAbsent: mark ? mark.isAbsent : false,
        };
      }),
    }));

    return sendSuccess(res, { examEvent: event, students, subjects }, 'Event report card retrieved successfully');
  } catch (error) {
    logger.error('Error fetching event report card', { error });
    return sendError(res, 'Failed to fetch event report card', 500);
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

    // Get all subjects for this student's class+session
    const subjects = await Subject.findAll({
      where: { sessionId: parseInt(String(sessionId)), schoolId, classId: (enrollment as any).classId },
      include: [
        {
          association: 'exams',
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

    const result = (subjects as any[]).map(subject => {
      const classTests = subject.exams.filter((e: any) => !e.examEventId);
      const classTestMarks = classTests.filter((e: any) => e.marks?.[0] && !e.marks[0].isAbsent && e.marks[0].marksObtained !== null);
      const classTestObtained = classTestMarks.reduce((sum: number, e: any) => sum + Number(e.marks[0].marksObtained), 0);
      const classTestTotal = classTestMarks.reduce((sum: number, e: any) => sum + e.totalMarks, 0);
      const classTestAvgPct = classTestTotal > 0 ? Math.round((classTestObtained / classTestTotal) * 100) : null;

      const eventResults = examEvents.map((event: any) => {
        const exam = subject.exams.find((e: any) => e.examEventId === event.id);
        if (!exam) return { eventId: event.id, eventName: event.name, marksObtained: null, totalMarks: null, passingMarks: null, isAbsent: false, examDate: null };
        const mark = exam.marks?.[0] || null;
        return {
          eventId: event.id,
          eventName: event.name,
          examId: exam.id,
          marksObtained: mark ? mark.marksObtained : null,
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
      examEvents: examEvents.map((e: any) => ({ id: e.id, name: e.name })),
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
    const schoolId = 1;
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
