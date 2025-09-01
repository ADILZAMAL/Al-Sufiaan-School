import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import User from './User';
import Vendor from './Vendor';

class VendorBill extends Model {
    public id!: number;
    public amount!: number;
    public name!: string;
    public userId!: number;
    public schoolId!: number;
    public vendorId!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initVendorBillModel = (sequelize: Sequelize) => {
    VendorBill.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: User,
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
            vendorId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: Vendor,
                    key: 'id'
                }
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
            modelName: 'VendorBill'
        }
    );
};

export default VendorBill;
