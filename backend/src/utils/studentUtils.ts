import Student from '../models/Student';
import { Op } from 'sequelize';

export const generateAdmissionNumber = async (schoolId: number, sid: string): Promise<string> => {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `${sid}${currentYear}`;

    const lastStudent = await Student.findOne({
      where: {
        schoolId,
        admissionNumber: {
          [Op.like]: `${prefix}%`
        }
      },
      order: [['admissionNumber', 'DESC']]
    });

    let nextNumber = 1;
    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.admissionNumber.slice(-4)) || 0;
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    const timestamp = Date.now().toString().slice(-4);
    return `${sid}${new Date().getFullYear()}${timestamp}`;
  }
};


