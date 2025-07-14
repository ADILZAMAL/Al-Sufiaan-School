import { Request, Response } from 'express';
import School from '../models/School';
import { validationResult } from 'express-validator';
import { sendError, sendSuccess } from '../utils/response';

export const onboardSchool = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const school = await School.create(req.body);
    sendSuccess(res, school, 'School onboarded successfully', 201);
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
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
    console.log('Error fetching school', error);
    sendError(res, 'An error occurred while fetching the school');
  }
};
