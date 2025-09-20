import { Request, Response } from 'express';
import NonTeachingStaff from '../models/NonTeachingStaff';
import { sendSuccess, sendError } from '../utils/response';

export const createNonTeachingStaff = async (req: Request, res: Response) => {
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
        const existingStaffByEmail = await NonTeachingStaff.findOne({ where: { email } });
        if (existingStaffByEmail) {
            return sendError(res, 'Email already exists', 400);
        }

        // Check if Aadhaar number already exists
        const existingStaffByAadhaar = await NonTeachingStaff.findOne({ where: { aadhaarNumber } });
        if (existingStaffByAadhaar) {
            return sendError(res, 'Aadhaar number already exists', 400);
        }

        const nonTeachingStaff = await NonTeachingStaff.create({
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

        return sendSuccess(res, nonTeachingStaff, 'Non-teaching staff created successfully', 201);
    } catch (error: any) {
        console.error('Error creating non-teaching staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getAllNonTeachingStaff = async (req: Request, res: Response) => {
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

        const nonTeachingStaff = await NonTeachingStaff.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        return sendSuccess(res, nonTeachingStaff, 'Non-teaching staff retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching non-teaching staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getNonTeachingStaffById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const nonTeachingStaff = await NonTeachingStaff.findByPk(id);

        if (!nonTeachingStaff) {
            return sendError(res, 'Non-teaching staff not found', 404);
        }

        return sendSuccess(res, nonTeachingStaff, 'Non-teaching staff retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching non-teaching staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const updateNonTeachingStaff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const nonTeachingStaff = await NonTeachingStaff.findByPk(id);

        if (!nonTeachingStaff) {
            return sendError(res, 'Non-teaching staff not found', 404);
        }

        // If email is being updated, check if it already exists
        if (updateData.email && updateData.email !== nonTeachingStaff.email) {
            const existingStaffByEmail = await NonTeachingStaff.findOne({ 
                where: { email: updateData.email } 
            });
            if (existingStaffByEmail) {
                return sendError(res, 'Email already exists', 400);
            }
        }

        // If Aadhaar is being updated, check if it already exists
        if (updateData.aadhaarNumber && updateData.aadhaarNumber !== nonTeachingStaff.aadhaarNumber) {
            const existingStaffByAadhaar = await NonTeachingStaff.findOne({ 
                where: { aadhaarNumber: updateData.aadhaarNumber } 
            });
            if (existingStaffByAadhaar) {
                return sendError(res, 'Aadhaar number already exists', 400);
            }
        }

        await nonTeachingStaff.update(updateData);

        return sendSuccess(res, nonTeachingStaff, 'Non-teaching staff updated successfully');
    } catch (error: any) {
        console.error('Error updating non-teaching staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const markNonTeachingStaffLeftSchool = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const nonTeachingStaff = await NonTeachingStaff.findByPk(id);

        if (!nonTeachingStaff) {
            return sendError(res, 'Non-teaching staff not found', 404);
        }

        await nonTeachingStaff.update({ active: false });

        return sendSuccess(res, nonTeachingStaff, 'Non-teaching staff marked as left school successfully');
    } catch (error: any) {
        console.error('Error marking non-teaching staff as left school:', error);
        return sendError(res, 'Internal server error', 500);
    }
};
