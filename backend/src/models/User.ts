import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';

class User extends Model {
    public id!: number;
    public email!: string | null;
    public password!: string;
    public firstName!: string | null;
    public lastName!: string | null;
    public mobileNumber?: string | null;
    public staffId?: number | null;
    public role!: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER' | 'TEACHER';
    public schoolId!: number;
    public lastLogin?: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

export const initUserModel = (sequelize: Sequelize) => {
    User.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        mobileNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        staffId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        role: {
            type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'CASHIER', 'TEACHER'),
            allowNull: false,
            defaultValue: 'CASHIER',
        },
        schoolId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: School,
                key: 'id'
            }
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
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
    }, {
        sequelize,
        modelName: 'User',
        paranoid: true,
        indexes: [
          {
            name: 'user_email_index',
            unique: true,
            fields: ['email']
          },
          {
            name: 'user_mobileNumber_unique',
            unique: true,
            fields: ['mobileNumber']
          },
          {
            name: 'user_staffId_unique',
            unique: true,
            fields: ['staffId']
          }
        ]
    });
};

export default User;
