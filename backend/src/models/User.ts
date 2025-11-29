import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';

class User extends Model {
    public id!: number;
    public email!: string;
    public password!: string;
    public firstName!: string;
    public lastName!: string;
    public role!: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER';
    public schoolId!: number;
    public status!: 'ACTIVE' | 'INACTIVE';
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
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'CASHIER'),
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
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            allowNull: false,
            defaultValue: 'ACTIVE',
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
          }
        ]
    });
};

export default User;
