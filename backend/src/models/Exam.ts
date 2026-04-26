import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './User';

class Exam extends Model {
  public id!: number;
  public subjectId!: number;
  public examEventId!: number | null;
  public chapterId!: number | null; // kept nullable for migration compatibility
  public schoolId!: number;
  public name!: string;
  public totalMarks!: number;
  public passingMarks!: number;
  public examDate!: string | null;
  public createdBy!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initExamModel = (sequelize: Sequelize) => {
  Exam.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      examEventId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      chapterId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Exam name is required' },
        },
      },
      totalMarks: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      passingMarks: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      examDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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
      modelName: 'Exam',
      tableName: 'exams',
      timestamps: true,
      indexes: [
        {
          fields: ['subjectId'],
          name: 'exams_subject_index',
        },
        {
          fields: ['examEventId'],
          name: 'exams_event_index',
        },
      ],
    }
  );
};

export default Exam;
