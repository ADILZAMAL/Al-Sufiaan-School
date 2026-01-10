import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import sequelize from '../config/database';
import Student from './Student';
import StudentMonthlyFee from './StudentMonthlyFee';
import User from './User';
import School from './School';

class StudentFeePayment extends Model {
  public id!: number;
  public schoolId!: number;
  public studentId!: number;
  public studentMonthlyFeeId!: number;
  public amountPaid!: number;
  public paymentDate!: Date;
  public paymentMode!: string;
  public referenceNumber?: string;
  public receivedBy!: number;
  public remarks?: string | null;
  public verified!: boolean;
  public verifiedBy?: number | null;
}

export const initStudentFeePaymentModel = (sequelize: Sequelize) => {
  StudentFeePayment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Student,
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      studentMonthlyFeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: StudentMonthlyFee,
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      paymentMode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      referenceNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      receivedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: User,
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: User,
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    },
    {
      sequelize,
      modelName: 'StudentFeePayment',
      tableName: 'StudentFeePayments',
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          fields: ['studentMonthlyFeeId'],
          name: 'student_monthly_fee_payment_student_monthly_fee_id_idx',
        },
        {
          fields: ['schoolId'],
          name: 'student_fee_payment_school_id_idx',
        },
        {
          fields: ['verifiedBy'],
          name: 'student_fee_payment_verified_by_idx',
        }
      ]
    }
  )
};

export default StudentFeePayment;
