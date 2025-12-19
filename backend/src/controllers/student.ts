import { Request, Response } from 'express';
import { Student } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { validationResult } from 'express-validator';
import { generateAdmissionNumber } from '../utils/studentUtils';

// Get all students
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const schoolId = req.schoolId;
    if(!schoolId){
      return sendError(res, 'School ID not found in request');
    }

    const whereClause: any = {schoolId};

    const students = await Student.findAll({
      where: whereClause,
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] },
        { association: 'creator', attributes: ['firstName', 'lastName'] } // Including createdBy user details
      ],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });

    return sendSuccess(res, students, 'Students retrieved successfully');
  } catch (error) {
    console.error('Error fetching students:', error);
    return sendError(res, 'Failed to fetch students', 500);
  }
};

// Get student by ID
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] }
      ]
    });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    return sendSuccess(res, student, 'Student retrieved successfully');
  } catch (error) {
    console.error('Error fetching student:', error);
    return sendError(res, 'Failed to fetch student', 500);
  }
};

// Create new student
export const createStudent = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()){
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const schoolId = parseInt(req.schoolId);
    if(!schoolId){
      return sendError(res, 'School ID not found in request');
    }
    const userId = parseInt(req.userId)
    if(!userId){
      return sendError(res, 'User ID not found in request')
    }

    const studentData = {
      ...req.body,
      schoolId: schoolId,
      createdBy: userId,
      admissionNumber: await generateAdmissionNumber(schoolId)
    };

    const student = await Student.create(studentData);
    
    const createdStudent = await Student.findByPk(student.id, {
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] }
      ]
    });

    return sendSuccess(res, createdStudent, 'Student created successfully', 201);
  } catch (error) {
    console.error('Error creating student:', error);
    return sendError(res, 'Failed to create student', 500);
  }
};

// Update student
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    await student.update(updateData);
    
    const updatedStudent = await Student.findByPk(id, {
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] }
      ]
    });

    return sendSuccess(res, updatedStudent, 'Student updated successfully');
  } catch (error) {
    console.error('Error updating student:', error);
    return sendError(res, 'Failed to update student', 500);
  }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    await student.destroy();

    return sendSuccess(res, null, 'Student deleted successfully');
  } catch (error) {
    console.error('Error deleting student:', error);
    return sendError(res, 'Failed to delete student', 500);
  }
};

// Get students by class
export const getStudentsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { sectionId } = req.query;

    const whereClause: any = { classId };
    if (sectionId) {
      whereClause.sectionId = sectionId;
    }

    const students = await Student.findAll({
      where: whereClause,
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] }
      ],
      order: [['rollNumber', 'ASC']]
    });

    return sendSuccess(res, students, 'Students retrieved successfully');
  } catch (error) {
    console.error('Error fetching students by class:', error);
    return sendError(res, 'Failed to fetch students', 500);
  }
};
