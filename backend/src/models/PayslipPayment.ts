import { Model, DataTypes, Sequelize } from 'sequelize';
import Payslip from './Payslip';
import User from './User';
import School from './School';
import Expense from './Expense';

class PayslipPayment extends Model {
    public id!: number;
    public payslipId!: number;
    public paymentAmount!: number;
    public paymentDate!: Date;
    public paymentMethod!: 'Cash' | 'UPI' | 'Bank Transfer';
    public notes!: string | null;
    public paidBy!: number;
    public expenseId!: number;
    public schoolId!: number;
    
    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    
    // Associations
    public payslip?: any;
    public expense?: any;
    public paidByUser?: any;
}

export const initPayslipPaymentModel = (sequelize: Sequelize) => {
    PayslipPayment.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        payslipId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Payslip,
                key: 'id'
            }
        },
        paymentAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0.01
            }
        },
        paymentDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.ENUM('Cash', 'UPI', 'Bank Transfer'),
            allowNull: false,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        paidBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
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
        schoolId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: School,
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
    }, {
        sequelize,
        modelName: 'PayslipPayment',
        tableName: 'payslip_payments',
        indexes: [
            {
                name: 'payslip_payment_payslip_index',
                fields: ['payslipId']
            },
            {
                name: 'payslip_payment_school_index',
                fields: ['schoolId']
            },
            {
                name: 'payslip_payment_date_index',
                fields: ['paymentDate']
            },
            {
                name: 'payslip_payment_user_index',
                fields: ['paidBy']
            }
        ]
    });
};

export default PayslipPayment;
