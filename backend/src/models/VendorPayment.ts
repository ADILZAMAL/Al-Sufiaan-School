import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import User from './User';
import Vendor from './Vendor';
import Expense from './Expense';

class VendorPayment extends Model {
    public id!: number;
    public amount!: number;
    public paymentDate!: Date;
    public paymentMethod!: string;
    public vendorId!: number;
    public userId!: number;
    public schoolId!: number;
    public expenseId!: number; // Reference to the created expense
    public notes?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initVendorPaymentModel = (sequelize: Sequelize) => {
    VendorPayment.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0
                }
            },
            paymentDate: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            paymentMethod: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 50]
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
            expenseId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: Expense,
                    key: 'id'
                }
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
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
            modelName: 'VendorPayment'
        }
    );
};

export default VendorPayment;
