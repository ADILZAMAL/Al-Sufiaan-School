import { DataTypes, Model, Sequelize } from 'sequelize';
import Chapter from './Chapter';
import User from './User';

class Exam extends Model {
  public id!: number;
  public chapterId!: number;
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
      chapterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Chapter, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
          fields: ['chapterId'],
          name: 'exams_chapter_index',
        },
      ],
    }
  );
};

export default Exam;
