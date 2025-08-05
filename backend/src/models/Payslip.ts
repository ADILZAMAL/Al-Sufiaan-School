import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import TeachingStaff from './TeachingStaff';
import NonTeachingStaff from './NonTeachingStaff';
import User from './User';

class Payslip extends Model {
    // Payslip Identity
    public id!: number;
    public payslipNumber!: string;
    
    // Staff Reference
    public staffId!: number;
    public staffType!: 'teaching' | 'non-teaching';
    
    // Period Information
    public month!: number;
    public year!: number;
    public monthName!: string;
    
    // Staff Details (snapshot at time of generation)
    public staffName!: string;
    public staffEmail!: string;
    public staffMobile!: string;
    public staffRole!: string;
    public staffAadhaar!: string;
    public staffAccountNumber!: string;
    public staffIfscCode!: string;
    
    // School Details (snapshot)
    public schoolName!: string;
    public schoolAddress!: string;
    public schoolPhone!: string;
    public schoolEmail!: string;
    
    // Salary Calculation
    public baseSalary!: number;
    public perDaySalary!: number;
    public workingDays!: number;
    public totalDays!: number;
    public presentDays!: number;
    public effectiveSalaryDays!: number;
    public absentDays!: number;
    public casualLeave!: number;
    public halfDays!: number;
    
    // Financial Calculation
    public grossSalary!: number;
    public deductions!: number;
    public netSalary!: number;
    
    // Audit Information
    public generatedBy!: number;
    public generatedDate!: Date;
    public schoolId!: number;
    
    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initPayslipModel = (sequelize: Sequelize) => {
    Payslip.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        payslipNumber: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        staffId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        staffType: {
            type: DataTypes.ENUM('teaching', 'non-teaching'),
            allowNull: false,
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 12
            }
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 2020,
                max: 2050
            }
        },
        monthName: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        // Staff Details Snapshot
        staffName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        staffEmail: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        staffMobile: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        staffRole: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        staffAadhaar: {
            type: DataTypes.STRING(12),
            allowNull: false,
        },
        staffAccountNumber: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        staffIfscCode: {
            type: DataTypes.STRING(11),
            allowNull: true,
        },
        // School Details Snapshot
        schoolName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        schoolAddress: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        schoolPhone: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        schoolEmail: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Salary Calculation
        baseSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        perDaySalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        workingDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 20,
                max: 31
            }
        },
        totalDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30,
        },
        presentDays: {
            type: DataTypes.DECIMAL(4, 1),
            allowNull: false,
        },
        effectiveSalaryDays: {
            type: DataTypes.DECIMAL(4, 1),
            allowNull: false,
        },
        absentDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        casualLeave: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        halfDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        // Financial Calculation
        grossSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        deductions: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        netSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        // Audit Information
        generatedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: 'id'
            }
        },
        generatedDate: {
            type: DataTypes.DATE,
            allowNull: false,
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
        modelName: 'Payslip',
        tableName: 'payslips',
        indexes: [
            {
                name: 'payslip_unique_staff_month',
                unique: true,
                fields: ['staffId', 'staffType', 'month', 'year']
            },
            {
                name: 'payslip_number_index',
                unique: true,
                fields: ['payslipNumber']
            },
            {
                name: 'payslip_school_index',
                fields: ['schoolId']
            },
            {
                name: 'payslip_staff_index',
                fields: ['staffId', 'staffType']
            },
            {
                name: 'payslip_period_index',
                fields: ['month', 'year']
            }
        ]
    });
};

export default Payslip;
