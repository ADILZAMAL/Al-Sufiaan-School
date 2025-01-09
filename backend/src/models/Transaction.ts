import {Model, DataTypes, Sequelize} from 'sequelize'
import School from './School'
import User from './User'
import sequelize from '../config/database';
import Product from './Product';
import Class from './Class';

enum Status {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILURE = 'failure'
}

enum PaymentMode {
    UPI = 'upi',
    CASH = 'cash'
}

class Transaction extends Model {
    public id!: number;
    public totalAmount!: number;
    public discount!: number;
    public studentName!: string;
    public parentName!: string;
    public status!: Status;
    public paymentMode!: PaymentMode;
    public schoolId!: number;
    public productId!: number;
    public class!: string;
    public section!: string;
    public userId!: number;
    public createdAt!: Date;
    public updatedAt!: Date;
}

export const initTransactionModel = (sequelize: Sequelize): void => {
    Transaction.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            totalAmount: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            discount: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            studentName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            parentName: {
                type: DataTypes.STRING,
                allowNull: false,  
            },
            status: {
                type: DataTypes.ENUM(...Object.values(Status)),
                allowNull: false,
                defaultValue: Status.PENDING
            },
            paymentMode: {
                type: DataTypes.ENUM(...Object.values(PaymentMode)),
                allowNull: false,
            },
            schoolId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: School,
                    key: 'id'
                }
            },
            class: {
                type: DataTypes.STRING,
                allowNull: false
            },
            section: {
                type: DataTypes.STRING,
                allowNull: false
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: User,
                    key: 'id'
                }
            },
            createdAt: {
                type: DataTypes. DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            modelName: 'Transaction'
        }
    )
    // Transaction.belongsTo(School, {foreignKey: 'schoolId', as: 'school'})
    // Transaction.belongsTo(Class, {foreignKey: 'classId', as: 'class'})
    // Transaction.belongsTo(User, {foreignKey: 'userId', as: 'user'})
    // Transaction.belongsTo(Product, {foreignKey: 'productId', as: 'product'})
}

export default Transaction;