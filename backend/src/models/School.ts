import sequelize from '../config/database';
import { Model, DataTypes, Sequelize } from 'sequelize'


//Define a class that extends Model
class School extends Model {
  public id!: number;
  public name!: string;
  public street!: string;
  public city!: string;
  public district!: string;
  public state!: string;
  public pincode!: string;
  public mobile!: string;
  public udiceCode!: string;
  public active!: boolean;
  public email!: string;
  public sid!: string;
  public paymentModes!: string[];
  public hostelFee?: number;
  public admissionFee?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initSchoolModel = (sequelize: Sequelize): void => {
  School.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      street: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      district: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pincode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mobile: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      udiceCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sid: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paymentModes: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: JSON.stringify(['Cash']),
        get() {
          const value = this.getDataValue('paymentModes');
          return typeof value === 'string' ? JSON.parse(value) : value;
        },
        set(value: string[]) {
          this.setDataValue('paymentModes', JSON.stringify(value || ['Cash']));
        }
      },
      hostelFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      admissionFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
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
      }
    },
    {
      sequelize,
      modelName: 'School',
      indexes: [
        {
          name: 'school_ssid_index',
          unique: true,
          fields: ['sid']
        }
      ]
    }
  )
}

export default School;
