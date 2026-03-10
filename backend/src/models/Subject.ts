import { DataTypes, Model, Sequelize } from 'sequelize';
import School from './School';
import AcademicSession from './AcademicSession';
import Class from './Class';

class Subject extends Model {
  public id!: number;
  public schoolId!: number;
  public sessionId!: number;
  public classId!: number;
  public name!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initSubjectModel = (sequelize: Sequelize) => {
  Subject.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: School, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: AcademicSession, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      classId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Class, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Subject name is required' },
        },
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
      modelName: 'Subject',
      tableName: 'subjects',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['schoolId', 'sessionId', 'classId', 'name'],
          name: 'subjects_unique_index',
        },
        {
          fields: ['sessionId', 'classId'],
          name: 'subjects_session_class_index',
        },
      ],
    }
  );
};

export default Subject;
