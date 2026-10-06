import { Request } from 'express';
import { Op } from 'sequelize';
import { TeacherSubjectAssignment, StudentEnrollment } from '../models';
import { HttpError } from './httpError';

/**
 * Permission helpers for TEACHER users. Admin roles pass every check; teachers
 * are limited to the subject/section pairs they are assigned to in
 * TeacherSubjectAssignment. Helpers throw HttpError(403) on failure.
 */

export const isTeacher = (req: Request) => req.userRole === 'TEACHER';

export const requireStaffId = (req: Request): number => {
  if (req.staffId == null) throw new HttpError(403, 'No staff profile is linked to this account');
  return req.staffId;
};

export const assertTeacherAssignment = async (
  req: Request,
  { subjectId, sectionId, sessionId }: { subjectId: number; sectionId: number; sessionId: number },
) => {
  if (!isTeacher(req)) return;
  const count = await TeacherSubjectAssignment.count({
    where: { schoolId: Number(req.schoolId), staffId: requireStaffId(req), subjectId, sectionId, sessionId },
  });
  if (count === 0) throw new HttpError(403, 'You are not assigned to this subject for this section');
};

export const assertTeacherInSection = async (
  req: Request,
  { sectionId, sessionId }: { sectionId: number; sessionId: number },
) => {
  if (!isTeacher(req)) return;
  const count = await TeacherSubjectAssignment.count({
    where: { schoolId: Number(req.schoolId), staffId: requireStaffId(req), sectionId, sessionId },
  });
  if (count === 0) throw new HttpError(403, 'You do not teach any subject in this section');
};

/**
 * Loads the enrollment of each student for a class (and optionally a section)
 * in a session. Throws 400 listing any student that isn't enrolled there.
 */
export const resolveEnrollments = async (
  schoolId: number,
  studentIds: number[],
  { sessionId, classId, sectionId }: { sessionId: number; classId: number; sectionId?: number | null },
): Promise<Map<number, StudentEnrollment>> => {
  const enrollments = await StudentEnrollment.findAll({
    where: {
      studentId: { [Op.in]: studentIds },
      sessionId,
      classId,
      ...(sectionId ? { sectionId } : {}),
    },
    attributes: ['id', 'studentId', 'sectionId', 'classId'],
    include: [{ association: 'student', attributes: [], where: { schoolId }, required: true }],
  });

  const byStudent = new Map(enrollments.map(e => [e.studentId, e] as const));
  const invalidStudentIds = studentIds.filter(id => !byStudent.has(id));
  if (invalidStudentIds.length > 0) {
    throw new HttpError(400, `${invalidStudentIds.length} student(s) are not enrolled in this class${sectionId ? ' and section' : ''}`, { invalidStudentIds });
  }
  return byStudent;
};
