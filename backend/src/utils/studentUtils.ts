import Student from '../models/Student';
import { Op } from 'sequelize';

/**
 * Generate admission number based on class and section
 * Format: [currentYear][classDigit][sectionCode][sequenceNumber]
 * Example: 2025110001 (2025, Class 1, Section A, Sequence 001)
 */
export const generateAdmissionNumber = async (schoolId: number): Promise<string> => {
  try {
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Find the highest admission number for this school in the current year
    const lastStudent = await Student.findOne({
      where: {
        schoolId: schoolId,
        admissionNumber: {
          [Op.like]: `ALS${currentYear}%` // Updated to search for ALSYYYY%
        }
      },
      order: [['admissionNumber', 'DESC']]
    });
    
    // Generate next sequential number
    let nextNumber = 1;
    if (lastStudent) {
      // Extract last 4 digits from ALSYYYYNNNN format
      const lastNumber = parseInt(lastStudent.admissionNumber.slice(-4)) || 0;
      nextNumber = lastNumber + 1;
    }
    
    return `ALS${currentYear}${nextNumber.toString().padStart(4, '0')}`; // Updated format
  } catch (error) {
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-4);
    return `ALS${new Date().getFullYear()}${timestamp}`; // Updated fallback format
  }
};


