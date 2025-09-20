import { Request, Response } from 'express';
import TeachingStaff from '../models/TeachingStaff';
import { sendSuccess, sendError } from '../utils/response';

export const createTeachingStaff = async (req: Request, res: Response) => {
    try {
        const {
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
            role,
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

        // Validate required fields
        if (!name || !gender || !dateOfBirth || !mobileNumber || !email || !aadhaarNumber || !nameAsPerAadhaar || !role || !schoolId) {
            return sendError(res, 'Missing required fields', 400);
        }

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
        const existingStaffByEmail = await TeachingStaff.findOne({ where: { email } });
        if (existingStaffByEmail) {
            return sendError(res, 'Email already exists', 400);
        }

        // Check if Aadhaar number already exists
        const existingStaffByAadhaar = await TeachingStaff.findOne({ where: { aadhaarNumber } });
        if (existingStaffByAadhaar) {
            return sendError(res, 'Aadhaar number already exists', 400);
        }

        const teachingStaff = await TeachingStaff.create({
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
            role,
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
            active: true,
            schoolId
        });

        return sendSuccess(res, teachingStaff, 'Teaching staff created successfully', 201);
    } catch (error: any) {
        console.error('Error creating teaching staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getAllTeachingStaff = async (req: Request, res: Response) => {
    try {
        const { schoolId, active } = req.query;

        if (!schoolId) {
            return sendError(res, 'School ID is required', 400);
        }

        const whereClause: any = { schoolId };
        
        // Add active filter if provided
        if (active !== undefined) {
            whereClause.active = active === 'true';
        }

        const teachingStaff = await TeachingStaff.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        return sendSuccess(res, teachingStaff, 'Teaching staff retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching teaching staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getTeachingStaffById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const teachingStaff = await TeachingStaff.findByPk(id);

        if (!teachingStaff) {
            return sendError(res, 'Teaching staff not found', 404);
        }

        return sendSuccess(res, teachingStaff, 'Teaching staff retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching teaching staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const updateTeachingStaff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const teachingStaff = await TeachingStaff.findByPk(id);

        if (!teachingStaff) {
            return sendError(res, 'Teaching staff not found', 404);
        }

        // If email is being updated, check if it already exists
        if (updateData.email && updateData.email !== teachingStaff.email) {
            const existingStaffByEmail = await TeachingStaff.findOne({ 
                where: { email: updateData.email } 
            });
            if (existingStaffByEmail) {
                return sendError(res, 'Email already exists', 400);
            }
        }

        // If Aadhaar is being updated, check if it already exists
        if (updateData.aadhaarNumber && updateData.aadhaarNumber !== teachingStaff.aadhaarNumber) {
            const existingStaffByAadhaar = await TeachingStaff.findOne({ 
                where: { aadhaarNumber: updateData.aadhaarNumber } 
            });
            if (existingStaffByAadhaar) {
                return sendError(res, 'Aadhaar number already exists', 400);
            }
        }

        await teachingStaff.update(updateData);

        return sendSuccess(res, teachingStaff, 'Teaching staff updated successfully');
    } catch (error: any) {
        console.error('Error updating teaching staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const markTeachingStaffLeftSchool = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const teachingStaff = await TeachingStaff.findByPk(id);

        if (!teachingStaff) {
            return sendError(res, 'Teaching staff not found', 404);
        }

        await teachingStaff.update({ active: false });

        return sendSuccess(res, teachingStaff, 'Teaching staff marked as left school successfully');
    } catch (error: any) {
        console.error('Error marking teaching staff as left school:', error);
        return sendError(res, 'Internal server error', 500);
    }
};
