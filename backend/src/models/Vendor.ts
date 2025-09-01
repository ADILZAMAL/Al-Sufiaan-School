import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import User from './User';
import ExpenseCategory from './ExpenseCategory';

class Vendor extends Model {
    public id!: number;
    public name!: string;
    public mobile!: string;
    public upiNumberId?: string;
    public accountNumber?: string;
    public ifscCode?: string;
    public address?: string;
    public categoryId!: number;
    public schoolId!: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initVendorModel = (sequelize: Sequelize) => {
    Vendor.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 100]
                }
            },
            mobile: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [10, 15]
                }
            },
            upiNumberId: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    len: [0, 50]
                }
            },
            accountNumber: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    len: [0, 20]
                }
            },
            ifscCode: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    len: [0, 11]
                }
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: ExpenseCategory,
                    key: 'id'
                }
            },
            schoolId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: School,
                    key: 'id'
                }
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
            modelName: 'Vendor',
            indexes: [
                {
                    unique: true,
                    fields: ['name', 'schoolId'],
                    name: 'unique_vendor_per_school'
                }
            ]
        }
    );
};

export default Vendor;
