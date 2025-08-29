import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import User from './User';
import ExpenseCategory from './ExpenseCategory';

export enum ExpenseCateogy {
    SALARY = 'SALARY',
    LPG = 'LPG',
    KITCHEN = 'KITCHEN',
    BUILDING = 'BUILDING',
    DIRECTOR = 'DIRECTOR',
    PETROL = 'PETROL',
    OTHERS = 'OTHERS',
    SOHAIL = 'SOHAIL',
    ADIL = 'ADIL'
}

class Expense extends Model {
    public id!: number;
    public amount!: number;
    public name!: string;
    public userId!: number;
    public schoolId!: number;
    public category!: ExpenseCateogy; // Keep for backward compatibility
    public categoryId!: number | null; // New field for dynamic categories
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
            category: {
                type: DataTypes.ENUM(...Object.values(ExpenseCateogy)),
                allowNull: true, // Made nullable for backward compatibility
            },
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: true, // Nullable for backward compatibility
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
