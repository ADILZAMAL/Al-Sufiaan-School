import { DataTypes, Model, Sequelize } from 'sequelize';
import School from './School';
import User from './User';
import sequelize from '../config/database';

class Holiday extends Model {
  public id!: number;
  public schoolId!: number; // Foreign Key
  public startDate!: Date; // Holiday start date (DATEONLY)
  public endDate!: Date; // Holiday end date (DATEONLY)
  public name!: string; // Holiday name
  public reason?: string; // Optional detailed reason
  public createdBy!: number; // Foreign Key to User

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual field for number of days
  get numberOfDays(): number {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
}

export const initHolidayModel = (sequelize: Sequelize) => {
  Holiday.init(
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
        onDelete: 'CASCADE',
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Holiday name is required',
          },
          len: {
            args: [1, 255],
            msg: 'Holiday name must be between 1 and 255 characters',
          },
        },
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      modelName: 'Holiday',
      tableName: 'holidays',
      timestamps: true,
      indexes: [
        {
          fields: ['schoolId'],
          name: 'holidays_school_index',
        },
        {
          fields: ['startDate', 'endDate'],
          name: 'holidays_dates_index',
        },
      ],
    }
  );
};

export default Holiday;
