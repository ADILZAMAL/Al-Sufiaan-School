import { Request, Response } from 'express';
import Staff from '../models/Staff';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { sendSuccess, sendError } from '../utils/response';
import { validatePasswordStrength } from '../utils/passwordValidator';

const TEACHING_ROLES = [
    'Principal',
    'Vice Principal',
    'Head of Department (HOD)',
    'PGT (Post Graduate Teacher)',
    'TGT (Trained Graduate Teacher)',
    'PRT (Primary Teacher)',
    'NTT (Nursery Teacher)',
    'Assistant Teacher',
    'Special Educator',
    'Physical Education Teacher (PET)',
    'Art / Music / Dance Teacher',
    'Computer Teacher',
    'Librarian',
    'Lab Assistant'
];

const NON_TEACHING_ROLES = [
    'Administrator',
    'Office Manager',
    'Accountant',
    'Clerk / Data Entry Operator',
    'Receptionist',
    'Admission Counselor',
    'IT Admin / Technician',
    'Transport Incharge',
    'Peon / Office Assistant',
    'Ayah / Nanny / Helper',
    'Security Guard',
    'Cook',
    'Driver / Conductor',
    'Gardener (Mali)'
];

const validateRole = (role: string, staffType: 'teaching' | 'non-teaching'): boolean => {
    const validRoles = staffType === 'teaching' ? TEACHING_ROLES : NON_TEACHING_ROLES;
    return validRoles.includes(role);
};

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

        // Validate staffType
        if (!staffType || !['teaching', 'non-teaching'].includes(staffType)) {
            return sendError(res, 'Invalid or missing staffType. Must be "teaching" or "non-teaching"', 400);
        }

        // Validate required fields
        if (!name || !gender || !dateOfBirth || !mobileNumber || !email || !aadhaarNumber || !nameAsPerAadhaar || !role || !schoolId || !dateOfJoiningService) {
            return sendError(res, 'Missing required fields', 400);
        }

        // Validate role for the given staffType
        if (!validateRole(role, staffType)) {
            return sendError(res, `Invalid role for staffType "${staffType}"`, 400);
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
            role,
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
        console.error('Error creating staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getAllStaff = async (req: Request, res: Response) => {
    try {
        const { schoolId, active, staffType } = req.query;

        if (!schoolId) {
            return sendError(res, 'School ID is required', 400);
        }

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
            include: [{ model: User, as: 'loginUser', attributes: ['id'], required: false }],
        });

        return sendSuccess(res, staff.map((s: any) => ({
            ...s.toJSON(),
            loginEnabled: !!s.loginUser,
            loginUser: undefined,
        })), 'Staff retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getStaffById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findByPk(id, {
            include: [{ model: User, as: 'loginUser', attributes: ['id', 'mobileNumber', 'lastLogin'], required: false }],
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
                mobileNumber: loginUser?.mobileNumber ?? null,
                lastLogin: loginUser?.lastLogin ?? null,
            },
            loginUser: undefined,
        }, 'Staff retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching staff:', error);
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

        // Validate role if being updated
        if (updateData.role && !validateRole(updateData.role, staff.staffType)) {
            return sendError(res, `Invalid role for staffType "${staff.staffType}"`, 400);
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

        await staff.update(updateData);

        // Auto-sync mobileNumber to linked User account if it was changed
        if (updateData.mobileNumber) {
            const linkedUser = await User.findOne({ where: { staffId: staff.id } });
            if (linkedUser) {
                await linkedUser.update({ mobileNumber: updateData.mobileNumber });
            }
        }

        return sendSuccess(res, staff, 'Staff updated successfully');
    } catch (error: any) {
        console.error('Error updating staff:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const markStaffLeftSchool = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findByPk(id);

        if (!staff) {
            return sendError(res, 'Staff not found', 404);
        }

        await staff.update({ active: false });

        return sendSuccess(res, staff, 'Staff marked as left school successfully');
    } catch (error: any) {
        console.error('Error marking staff as left school:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const enableStaffLogin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
            return sendError(res, passwordError, 400);
        }

        const staff = await Staff.findByPk(id);
        if (!staff) {
            return sendError(res, 'Staff not found', 404);
        }

        const existingByStaffId = await User.findOne({ where: { staffId: staff.id } });
        if (existingByStaffId) {
            return sendError(res, 'Login already enabled for this staff member', 400);
        }

        const existingByMobile = await User.findOne({ where: { mobileNumber: staff.mobileNumber } });
        if (existingByMobile) {
            return sendError(res, 'A user account with this mobile number already exists', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email: null,
            firstName: null,
            lastName: null,
            mobileNumber: staff.mobileNumber,
            password: hashedPassword,
            role: 'TEACHER',
            schoolId: staff.schoolId,
            staffId: staff.id,
        });

        return sendSuccess(res, {
            userId: newUser.id,
            mobileNumber: newUser.mobileNumber,
            role: newUser.role,
            staffId: staff.id,
        }, 'Staff login enabled successfully', 201);
    } catch (error: any) {
        console.error('Error enabling staff login:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const disableStaffLogin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findByPk(id);
        if (!staff) {
            return sendError(res, 'Staff not found', 404);
        }

        const userAccount = await User.findOne({ where: { staffId: staff.id } });
        if (!userAccount) {
            return sendError(res, 'No login account found for this staff member', 404);
        }

        await userAccount.destroy({ force: true });

        return sendSuccess(res, null, 'Staff login disabled successfully');
    } catch (error: any) {
        console.error('Error disabling staff login:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const resetStaffPassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        const passwordError = validatePasswordStrength(newPassword);
        if (passwordError) {
            return sendError(res, passwordError, 400);
        }

        const staff = await Staff.findByPk(id);
        if (!staff) {
            return sendError(res, 'Staff not found', 404);
        }

        const userAccount = await User.findOne({ where: { staffId: staff.id } });
        if (!userAccount) {
            return sendError(res, 'No login account found for this staff member. Enable login first.', 404);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userAccount.update({ password: hashedPassword });

        return sendSuccess(res, null, 'Password reset successfully');
    } catch (error: any) {
        console.error('Error resetting staff password:', error);
        return sendError(res, 'Internal server error', 500);
    }
};
