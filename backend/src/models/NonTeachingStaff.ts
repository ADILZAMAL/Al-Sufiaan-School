import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';

class NonTeachingStaff extends Model {
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
    public role!: string;
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
    public active!: boolean;
    public schoolId!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initNonTeachingStaffModel = (sequelize: Sequelize) => {
    NonTeachingStaff.init({
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
            ),
            allowNull: false,
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
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
        modelName: 'NonTeachingStaff',
        tableName: 'non_teaching_staff',
        indexes: [
            {
                name: 'non_teaching_staff_email_index',
                unique: true,
                fields: ['email']
            },
            {
                name: 'non_teaching_staff_aadhaar_index',
                unique: true,
                fields: ['aadhaarNumber']
            },
            {
                name: 'non_teaching_staff_school_index',
                fields: ['schoolId']
            }
        ]
    });
};

export default NonTeachingStaff;
