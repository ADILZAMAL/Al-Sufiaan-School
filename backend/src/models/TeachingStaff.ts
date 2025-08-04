import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';

class TeachingStaff extends Model {
    public id!: number;
    public name!: string;
    public gender!: 'Male' | 'Female' | 'Other';
    public dateOfBirth!: Date;
    public socialCategory!: string;
    public mobileNumber!: string;
    public email!: string;
    public aadhaarNumber!: string;
    public nameAsPerAadhaar!: string;
    public highestAcademicQualification!: string;
    public tradeDegree!: string;
    public highestProfessionalQualification!: string;
    public mathematicsLevel!: string;
    public scienceLevel!: string;
    public englishLevel!: string;
    public socialScienceLevel!: string;
    public scheduleVIIILanguageLevel!: string;
    public typeOfDisability!: string;
    public natureOfAppointment!: string;
    public dateOfJoiningService!: Date;
    public dateOfJoiningPresentSchool!: Date;
    public salaryPerMonth!: number;
    public upiNumber!: string;
    public accountNumber!: string;
    public accountName!: string;
    public ifscCode!: string;
    public photoUrl!: string;
    public schoolId!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initTeachingStaffModel = (sequelize: Sequelize) => {
    TeachingStaff.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        gender: {
            type: DataTypes.ENUM('Male', 'Female', 'Other'),
            allowNull: false,
        },
        dateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        socialCategory: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        mobileNumber: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        aadhaarNumber: {
            type: DataTypes.STRING(12),
            allowNull: false,
            unique: true,
        },
        nameAsPerAadhaar: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        highestAcademicQualification: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tradeDegree: {
            type: DataTypes.STRING,
            allowNull: true,
        },
  highestProfessionalQualification: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM(
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
    ),
    allowNull: false,
  },
        mathematicsLevel: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        scienceLevel: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        englishLevel: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        socialScienceLevel: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        scheduleVIIILanguageLevel: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        typeOfDisability: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        natureOfAppointment: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        dateOfJoiningService: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        dateOfJoiningPresentSchool: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        salaryPerMonth: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        upiNumber: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        accountNumber: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        accountName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ifscCode: {
            type: DataTypes.STRING(11),
            allowNull: true,
        },
        photoUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        schoolId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: School,
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        }
    }, {
        sequelize,
        modelName: 'TeachingStaff',
        tableName: 'teaching_staff',
        indexes: [
            {
                name: 'teaching_staff_email_index',
                unique: true,
                fields: ['email']
            },
            {
                name: 'teaching_staff_aadhaar_index',
                unique: true,
                fields: ['aadhaarNumber']
            },
            {
                name: 'teaching_staff_school_index',
                fields: ['schoolId']
            }
        ]
    });
};

export default TeachingStaff;
