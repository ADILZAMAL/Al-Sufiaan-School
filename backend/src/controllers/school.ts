import { Request, Response } from 'express';
import School from '../models/School';
import { validationResult } from 'express-validator';
import { sendError, sendSuccess } from '../utils/response';
import logger from '../utils/logger';

export const onboardSchool = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const school = await School.create(req.body);
    sendSuccess(res, school, 'School onboarded successfully', 201);
  } catch (error) {
    logger.error('Error onboarding school', { error });
    sendError(res, 'Something went wrong');
  }
};

export const getAllSchools = async (req: Request, res: Response) => {
  try {
    const schools = await School.findAll({
      attributes: ['id', 'name', 'sid'],
      order: [['name', 'ASC']]
    });
    sendSuccess(res, schools, 'Schools fetched successfully');
  } catch (error) {
    logger.error('Error fetching schools', { error });
    sendError(res, 'An error occurred while fetching schools');
  }
};

export const getSchoolById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return sendError(res, 'Invalid Id', 400);
  }
  if (!id) {
    return sendError(res, 'Id is required', 400);
  }

  try {
    const school = await School.findByPk(id);
    if (!school) {
      return sendError(res, 'School not found', 404);
    }
    sendSuccess(res, school, 'School fetched successfully');
  } catch (error) {
    logger.error('Error fetching school', { error });
    sendError(res, 'An error occurred while fetching the school');
  }
};

export const updateSchool = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return sendError(res, 'Invalid Id', 400);
  }

  try {
    const school = await School.findByPk(id);
    if (!school) {
      return sendError(res, 'School not found', 404);
    }

    // Update the school with provided data
    await school.update(req.body);
    
    sendSuccess(res, school, 'School updated successfully');
  } catch (error) {
    logger.error('Error updating school', { error });
    sendError(res, 'An error occurred while updating the school');
  }
};

export const getCurrentSchool = async (req: Request, res: Response) => {
  try {
    // Get the first active school as the current school
    const school = await School.findOne({
      where: { active: true }
    });
    
    if (!school) {
      return sendError(res, 'No active school found', 404);
    }
    
    sendSuccess(res, school, 'Current school fetched successfully');
  } catch (error) {
    logger.error('Error fetching current school', { error });
    sendError(res, 'An error occurred while fetching the current school');
  }
};
