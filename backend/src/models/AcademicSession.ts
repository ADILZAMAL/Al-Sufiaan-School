import { DataTypes, Model, Sequelize } from 'sequelize';
import School from './School';
import User from './User';

class AcademicSession extends Model {
  public id!: number;
  public schoolId!: number;
  public name!: string;
  public startDate!: string;
  public endDate!: string;
  public isActive!: boolean;
  public createdBy!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initAcademicSessionModel = (sequelize: Sequelize) => {
  AcademicSession.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: School,
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Session name is required',
          },
        },
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Start date is required',
          },
        },
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'End date is required',
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'id',
        },
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
      modelName: 'AcademicSession',
      tableName: 'academic_sessions',
      timestamps: true,
      indexes: [
        {
          fields: ['schoolId'],
          name: 'academic_sessions_school_index',
        },
        {
          fields: ['schoolId', 'isActive'],
          name: 'academic_sessions_school_active_index',
        },
      ],
    }
  );
};

export default AcademicSession;
