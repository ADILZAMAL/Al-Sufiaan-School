import { Request, Response } from 'express';
import Staff from '../models/Staff';
import User from '../models/User';
import Designation from '../models/Designation';
import sequelize from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { handleError } from '../utils/httpError';
import { disableLoginForStaff, syncLoginFromStaff } from '../utils/loginAccounts';
import logger from '../utils/logger';

export const createStaff = async (req: Request, res: Response) => {
    try {
        const {
            staffType,
            name,
            gender,
            dateOfBirth,
            socialCategory,
            mobileNumber,
            email,
            aadhaarNumber,
            nameAsPerAadhaar,
            highestAcademicQualification,
            tradeDegree,
            highestProfessionalQualification,
            designationId,
            mathematicsLevel,
            scienceLevel,
            englishLevel,
            socialScienceLevel,
            scheduleVIIILanguageLevel,
            typeOfDisability,
            natureOfAppointment,
            dateOfJoiningService,
            dateOfJoiningPresentSchool,
            salaryPerMonth,
            upiNumber,
            accountNumber,
            accountName,
            ifscCode,
            photoUrl,
            schoolId
        } = req.body;

        // Validate staffType
        if (!staffType || !['teaching', 'non-teaching'].includes(staffType)) {
            return sendError(res, 'Invalid or missing staffType. Must be "teaching" or "non-teaching"', 400);
        }

        // Validate required fields
        if (!name || !gender || !dateOfBirth || !mobileNumber || !email || !aadhaarNumber || !nameAsPerAadhaar || !schoolId || !dateOfJoiningService) {
            return sendError(res, 'Missing required fields', 400);
        }

        if (!designationId) {
            return sendError(res, 'designationId is required', 400);
        }

        // Validate designation
        const designation = await Designation.findOne({
            where: { id: designationId, schoolId, isActive: true },
        });
        if (!designation) {
            return sendError(res, 'Invalid or inactive designation', 400);
        }
        const resolvedDesignationId = designation.id;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return sendError(res, 'Invalid email format', 400);
        }

        // Validate mobile number format (10 digits)
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobileNumber)) {
            return sendError(res, 'Mobile number must be 10 digits', 400);
        }

        // Validate Aadhaar number format (12 digits)
        const aadhaarRegex = /^[0-9]{12}$/;
        if (!aadhaarRegex.test(aadhaarNumber)) {
            return sendError(res, 'Aadhaar number must be 12 digits', 400);
        }

        // Check if email already exists
        const existingByEmail = await Staff.findOne({ where: { email } });
        if (existingByEmail) {
            return sendError(res, 'Email already exists', 400);
        }

        // Check if Aadhaar number already exists
        const existingByAadhaar = await Staff.findOne({ where: { aadhaarNumber } });
        if (existingByAadhaar) {
            return sendError(res, 'Aadhaar number already exists', 400);
        }

        const staff = await Staff.create({
            staffType,
            name,
            gender,
            dateOfBirth,
            socialCategory,
            mobileNumber,
            email,
            aadhaarNumber,
            nameAsPerAadhaar,
            highestAcademicQualification,
            tradeDegree,
            highestProfessionalQualification,
            designationId: resolvedDesignationId,
            mathematicsLevel: staffType === 'non-teaching' ? null : mathematicsLevel,
            scienceLevel: staffType === 'non-teaching' ? null : scienceLevel,
            englishLevel: staffType === 'non-teaching' ? null : englishLevel,
            socialScienceLevel: staffType === 'non-teaching' ? null : socialScienceLevel,
            scheduleVIIILanguageLevel: staffType === 'non-teaching' ? null : scheduleVIIILanguageLevel,
            typeOfDisability,
            natureOfAppointment,
            dateOfJoiningService,
            dateOfJoiningPresentSchool,
            salaryPerMonth,
            upiNumber,
            accountNumber,
            accountName,
            ifscCode,
            photoUrl,
            active: true,
            schoolId
        });

        return sendSuccess(res, staff, 'Staff created successfully', 201);
    } catch (error: any) {
        logger.error('Error creating staff', { error });
        return sendError(res, 'Internal server error', 500);
    }
};

export const getAllStaff = async (req: Request, res: Response) => {
    try {
        const { active, staffType } = req.query;
        const schoolId = req.schoolId;

        const whereClause: any = { schoolId };

        if (active !== undefined) {
            whereClause.active = active === 'true';
        }

        if (staffType && ['teaching', 'non-teaching'].includes(staffType as string)) {
            whereClause.staffType = staffType;
        }

        const staff = await Staff.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'loginUser', attributes: ['id'], required: false },
                { model: Designation, as: 'designation', attributes: ['id', 'name'], required: false },
            ],
        });

        return sendSuccess(res, staff.map((s: any) => ({
            ...s.toJSON(),
            loginEnabled: !!s.loginUser,
            loginUser: undefined,
        })), 'Staff retrieved successfully');
    } catch (error: any) {
        logger.error('Error fetching staff', { error });
        return sendError(res, 'Internal server error', 500);
    }
};

export const getStaffById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findByPk(id, {
            include: [
                { model: User, as: 'loginUser', attributes: ['id', 'role', 'mobileNumber', 'lastLogin'], required: false },
                { model: Designation, as: 'designation', attributes: ['id', 'name'], required: false },
            ],
        });

        if (!staff) {
            return sendError(res, 'Staff not found', 404);
        }

        const loginUser = (staff as any).loginUser;
        return sendSuccess(res, {
            ...staff.toJSON(),
            loginStatus: {
                enabled: !!loginUser,
                userId: loginUser?.id ?? null,
                role: loginUser?.role ?? null,
                mobileNumber: loginUser?.mobileNumber ?? null,
                lastLogin: loginUser?.lastLogin ?? null,
            },
            loginUser: undefined,
        }, 'Staff retrieved successfully');
    } catch (error: any) {
        logger.error('Error fetching staff', { error });
        return sendError(res, 'Internal server error', 500);
    }
};

export const updateStaff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        const staff = await Staff.findByPk(id);

        if (!staff) {
            return sendError(res, 'Staff not found', 404);
        }

        // Prevent changing staffType after creation
        delete updateData.staffType;

        // The mobile number is also the staff member's login ID
        if (updateData.mobileNumber !== undefined && !/^[0-9]{10}$/.test(updateData.mobileNumber)) {
            return sendError(res, 'Mobile number must be 10 digits', 400);
        }

        // Validate designation if being updated
        if (updateData.designationId) {
            const designation = await Designation.findOne({
                where: { id: updateData.designationId, schoolId: staff.schoolId, isActive: true },
            });
            if (!designation) {
                return sendError(res, 'Invalid or inactive designation', 400);
            }
        }

        // If email is being updated, check uniqueness
        if (updateData.email && updateData.email !== staff.email) {
            const existingByEmail = await Staff.findOne({ where: { email: updateData.email } });
            if (existingByEmail) {
                return sendError(res, 'Email already exists', 400);
            }
        }

        // If Aadhaar is being updated, check uniqueness
        if (updateData.aadhaarNumber && updateData.aadhaarNumber !== staff.aadhaarNumber) {
            const existingByAadhaar = await Staff.findOne({ where: { aadhaarNumber: updateData.aadhaarNumber } });
            if (existingByAadhaar) {
                return sendError(res, 'Aadhaar number already exists', 400);
            }
        }

        // One transaction: if the new number is already someone else's login, the staff record is not saved either
        await sequelize.transaction(async (transaction) => {
            await staff.update(updateData, { transaction });
            await syncLoginFromStaff(staff, transaction);
        });

        return sendSuccess(res, staff, 'Staff updated successfully');
    } catch (error: any) {
        return handleError(res, error, 'Error updating staff');
    }
};

export const markStaffLeftSchool = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findByPk(id);

        if (!staff) {
            return sendError(res, 'Staff not found', 404);
        }

        await sequelize.transaction(async (transaction) => {
            await staff.update({ active: false }, { transaction });
            await disableLoginForStaff(staff.id, transaction);
        });

        return sendSuccess(res, staff, 'Staff marked as left school successfully');
    } catch (error: any) {
        logger.error('Error marking staff as left school', { error });
        return sendError(res, 'Internal server error', 500);
    }
};
