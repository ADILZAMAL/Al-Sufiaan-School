import { DataTypes, Model, Sequelize } from 'sequelize';
import Subject from './Subject';
import Staff from './Staff';

class Chapter extends Model {
  public id!: number;
  public subjectId!: number;
  public schoolId!: number;
  public name!: string;
  public orderNumber!: number;
  public isTaught!: boolean;
  public taughtOn!: string | null;
  public taughtBy!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initChapterModel = (sequelize: Sequelize) => {
  Chapter.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Subject, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Chapter name is required' },
        },
      },
      orderNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      isTaught: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taughtOn: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      taughtBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: Staff, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      modelName: 'Chapter',
      tableName: 'chapters',
      timestamps: true,
      indexes: [
        {
          fields: ['subjectId'],
          name: 'chapters_subject_index',
        },
      ],
    }
  );
};

export default Chapter;
