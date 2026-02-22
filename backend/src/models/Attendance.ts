import { DataTypes, Model, Sequelize } from 'sequelize';
import School from './School';
import Student from './Student';
import User from './User';
import AcademicSession from './AcademicSession';
import sequelize from '../config/database';

/* ===========================
   ENUMS
   =========================== */
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
}

class Attendance extends Model {
  public id!: number;
  public studentId!: number; // Foreign Key
  public sessionId!: number; // Foreign Key
  public date!: Date;
  public status!: AttendanceStatus;
  public markedBy!: number; // Foreign Key to User
  public schoolId!: number; // Foreign Key
  public remarks?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initAttendanceModel = (sequelize: Sequelize) => {
  Attendance.init(
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
        onDelete: 'CASCADE',
      },
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: AcademicSession,
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Date is required',
          },
        },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(AttendanceStatus)),
        allowNull: false,
        validate: {
          isIn: {
            args: [Object.values(AttendanceStatus)],
            msg: 'Status must be either PRESENT or ABSENT',
          },
        },
      },
      markedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
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
        onDelete: 'CASCADE',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      },
    },
    {
      sequelize,
      modelName: 'Attendance',
      tableName: 'attendances',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['studentId', 'date', 'schoolId'],
          name: 'attendances_student_date_school_unique',
        },
        {
          fields: ['date'],
          name: 'attendances_date_index',
        },
        {
          fields: ['studentId'],
          name: 'attendances_student_index',
        },
        {
          fields: ['schoolId'],
          name: 'attendances_school_index',
        },
        {
          fields: ['status'],
          name: 'attendances_status_index',
        },
        {
          fields: ['sessionId'],
          name: 'attendances_session_index',
        },
      ],
    }
  );
};

export default Attendance;
