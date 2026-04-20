import { Request, Response } from 'express';
import School from '../models/School';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { sendError, sendSuccess } from '../utils/response';
import logger from '../utils/logger';
import https from 'https';
import http from 'http';

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

    await school.update(req.body);

    sendSuccess(res, school, 'School updated successfully');
  } catch (error) {
    logger.error('Error updating school', { error });
    sendError(res, 'An error occurred while updating the school');
  }
};

export const createSuperAdmin = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  const { firstName, lastName, mobileNumber, adminPassword, schoolId } = req.body;

  try {
    const school = await School.findByPk(schoolId);
    if (!school) {
      return sendError(res, 'School not found', 404);
    }

    const existingSuperAdmin = await User.findOne({ where: { schoolId, role: 'SUPER_ADMIN' } });
    if (existingSuperAdmin) {
      return sendError(res, 'A super admin already exists for this school', 400);
    }

    const existing = await User.findOne({ where: { mobileNumber } });
    if (existing) {
      return sendError(res, 'User with this mobile number already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const user = await User.create({
      firstName,
      lastName,
      mobileNumber,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      schoolId,
    });

    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
    });

    sendSuccess(res, userResponse, 'Super admin created successfully', 201);
  } catch (error) {
    logger.error('Error creating super admin', { error });
    sendError(res, 'Something went wrong');
  }
};

export const getSchoolSuperAdmin = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return sendError(res, 'Invalid Id', 400);
  }

  try {
    const user = await User.findOne({
      where: { schoolId: id, role: 'SUPER_ADMIN' },
      attributes: { exclude: ['password'] },
    });
    sendSuccess(res, user, 'Super admin fetched successfully');
  } catch (error) {
    logger.error('Error fetching super admin', { error });
    sendError(res, 'An error occurred while fetching the super admin');
  }
};

export const getCurrentSchool = async (req: Request, res: Response) => {
  try {
    const school = await School.findByPk(req.schoolId);

    if (!school) {
      return sendError(res, 'School not found', 404);
    }

    sendSuccess(res, school, 'Current school fetched successfully');
  } catch (error) {
    logger.error('Error fetching current school', { error });
    sendError(res, 'An error occurred while fetching the current school');
  }
};

export const getLogoBase64 = async (req: Request, res: Response) => {
  try {
    const school = await School.findByPk(req.schoolId, { attributes: ['logoUrl'] });
    if (!school?.logoUrl) return sendError(res, 'No logo found', 404);

    const url = school.logoUrl;
    const proto = url.startsWith('https') ? https : http;

    proto.get(url, (imgRes) => {
      const chunks: Buffer[] = [];
      imgRes.on('data', (chunk: Buffer) => chunks.push(chunk));
      imgRes.on('end', () => {
        const buffer = Buffer.concat(chunks as unknown as Uint8Array[]);
        const mimeType = imgRes.headers['content-type'] || 'image/jpeg';
        const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
        sendSuccess(res, { base64 }, 'Logo fetched successfully');
      });
      imgRes.on('error', () => sendError(res, 'Failed to fetch logo', 500));
    }).on('error', () => sendError(res, 'Failed to fetch logo', 500));
  } catch (error) {
    logger.error('Error fetching logo base64', { error });
    sendError(res, 'Failed to fetch logo');
  }
};
