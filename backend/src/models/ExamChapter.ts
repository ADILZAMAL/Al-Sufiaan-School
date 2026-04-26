import { DataTypes, Model, Sequelize } from 'sequelize';
import Exam from './Exam';
import Chapter from './Chapter';

class ExamChapter extends Model {
  public id!: number;
  public examId!: number;
  public chapterId!: number;
  public schoolId!: number;
}

export const initExamChapterModel = (sequelize: Sequelize) => {
  ExamChapter.init(
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
    },
    {
      sequelize,
      modelName: 'ExamChapter',
      tableName: 'exam_chapters',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['examId', 'chapterId'],
          name: 'exam_chapters_unique',
        },
      ],
    }
  );
};

export default ExamChapter;
