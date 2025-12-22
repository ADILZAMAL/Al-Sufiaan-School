import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import sequelize from '../config/database';
import Student from './Student';
import StudentMonthlyFee from './StudentMonthlyFee';
import User from './User';

class StudentFeePayment extends Model {
  public id!: number;
  public studentId!: number;
  public studentMonthlyFeeId!: number;
  public amountPaid!: number;
  public paymentDate!: Date;
  public paymentMode!: string;
  public referenceNumber?: string;
  public receivedBy!: number;
  public remarks?: string | null;
}

export const initStudentFeePaymentModel = (sequelize: Sequelize) => {
  StudentFeePayment.init(
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
        }
      ]
    }
)
};

export default StudentFeePayment;
