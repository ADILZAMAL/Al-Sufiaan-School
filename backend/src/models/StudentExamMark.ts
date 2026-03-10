import { DataTypes, Model, Sequelize } from 'sequelize';
import Exam from './Exam';
import Student from './Student';
import User from './User';

class StudentExamMark extends Model {
  public id!: number;
  public examId!: number;
  public studentId!: number;
  public schoolId!: number;
  public marksObtained!: number | null;
  public isAbsent!: boolean;
  public enteredBy!: number;
  public enteredAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initStudentExamMarkModel = (sequelize: Sequelize) => {
  StudentExamMark.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      examId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Exam, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Student, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      marksObtained: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      isAbsent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      enteredBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      enteredAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
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
      modelName: 'StudentExamMark',
      tableName: 'student_exam_marks',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['examId', 'studentId'],
          name: 'student_exam_marks_unique_index',
        },
        {
          fields: ['examId'],
          name: 'student_exam_marks_exam_index',
        },
        {
          fields: ['studentId'],
          name: 'student_exam_marks_student_index',
        },
      ],
    }
  );
};

export default StudentExamMark;
