import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import User from './User';
import ExpenseCategory from './ExpenseCategory';

class Expense extends Model {
    public id!: number;
    public amount!: number;
    public name!: string;
    public userId!: number;
    public schoolId!: number;
    public categoryId!: number; // Now mandatory - references ExpenseCategory
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initExpenseModel = (sequelize: Sequelize) => {
    Expense.init(
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
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false, // Now mandatory
                references: {
                    model: ExpenseCategory,
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
            modelName: 'Expense'
        }
    );
};

export default Expense;
