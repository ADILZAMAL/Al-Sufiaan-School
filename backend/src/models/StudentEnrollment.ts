import { DataTypes, Model, Sequelize } from 'sequelize';
import AcademicSession from './AcademicSession';
import Student from './Student';
import Class from './Class';
import Section from './Section';
import User from './User';

class StudentEnrollment extends Model {
  public id!: number;
  public studentId!: number;
  public sessionId!: number;
  public classId!: number;
  public sectionId!: number;
  public rollNumber!: string | null;
  public promotedBy!: number | null;
  public promotedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initStudentEnrollmentModel = (sequelize: Sequelize) => {
  StudentEnrollment.init(
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
      classId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Class,
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Section,
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      rollNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      promotedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: User,
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      promotedAt: {
        type: DataTypes.DATE,
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
      modelName: 'StudentEnrollment',
      tableName: 'student_enrollments',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['studentId', 'sessionId'],
          name: 'enrollment_student_session_unique',
        },
        {
          fields: ['sessionId', 'classId', 'sectionId'],
          name: 'enrollment_session_class_section_index',
        },
      ],
    }
  );
};

export default StudentEnrollment;
