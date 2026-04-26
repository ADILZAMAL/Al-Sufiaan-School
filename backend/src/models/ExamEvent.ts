import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './User';

class ExamEvent extends Model {
  public id!: number;
  public name!: string;
  public sessionId!: number;
  public schoolId!: number;
  public createdBy!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initExamEventModel = (sequelize: Sequelize) => {
  ExamEvent.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Exam event name is required' },
        },
      },
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      modelName: 'ExamEvent',
      tableName: 'exam_events',
      timestamps: true,
      indexes: [
        {
          fields: ['schoolId', 'sessionId'],
          name: 'exam_events_school_session_index',
        },
      ],
    }
  );
};

export default ExamEvent;
