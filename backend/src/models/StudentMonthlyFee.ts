import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import sequelize from '../config/database';
import Student from './Student';
import School from './School';
import User from './User';
import StudentFeePayment from './StudentFeePayment';
import StudentMonthlyFeeItem from './StudentMonthlyFeeItem';


/* ===========================
    ENUMS
    =========================== */
export enum StudentMonthlyFeeStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

class StudentMonthlyFee extends Model{
  public id!: number;
  public studentId!: number;
  public schoolId!: number;
  public month!: number;
  public calendarYear!: number;
  public totalConfiguredAmount!: number;
  public totalAdjustment!: number;
  public totalPayableAmount!: number;
  public status!: StudentMonthlyFeeStatus;
  public discountReason?: string;
  public generatedAt!: Date;
  public generatedBy!: number;

  // Association properties
  public readonly feeItems?: StudentMonthlyFeeItem[];
  public readonly payments?: StudentFeePayment[];

  // Virtual field for academic session
  get getAcademicYear(): string {
    return this.month >= 4 ? `${this.calendarYear}-${this.calendarYear + 1}` : `${this.calendarYear - 1}-${this.calendarYear}`;
  }
}

export const initStudentMonthlyFeeModel = (sequelize: Sequelize) => {
  StudentMonthlyFee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Student,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
          model: School,
          key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
          min: 1,
          max: 12,
      },
    },
    calendarYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalConfiguredAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalAdjustment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalPayableAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(StudentMonthlyFeeStatus)),
      allowNull: false,
      defaultValue: StudentMonthlyFeeStatus.UNPAID,
    },
    discountReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    generatedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
          model: User,
          key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
  },
  {
    sequelize,
    modelName: 'StudentMonthlyFee',
    tableName: 'StudentMonthlyFees',
    timestamps: true,
    paranoid: true,
    indexes: [
    {
        unique: true,
        fields: ['studentId', 'calendarYear', 'month'],
        name: 'student_month_year_unique',
    },
    ],
  }
  )
};

export default StudentMonthlyFee;
