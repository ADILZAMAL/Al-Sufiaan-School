import {Model, DataTypes, Sequelize, Optional} from 'sequelize';
import School from './School';


// Enum for category

export enum ExpenseCateogy {
    SALARY = 'SALARY',
    LPG = 'LPG',
    KITCHEN = 'KITCHER',
    BUILDING = 'BUILDING',
    DIRECTOR = 'DIRECTOR',
    PETROL = 'PETROL'
}

// Define attributes for Expense
interface ExpenseAttributes {
    id: number;         //Primary key
    amount: number;
    remarks: string;
    userId: number;     //Foreign key
    schoolId: number;   //Foreign key
    category: ExpenseCateogy;
    createdAt: Date;
    updatedAt: Date;
}

// Define optional attributes for creating a Expense
interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define the Expense class
export class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
    public id!: number;
    public amount!: number;
    public remarks!: string;
    public userId!: number;
    public schoolId!: number;
    public category!: ExpenseCateogy;
    public readonly createdAt!: Date;
    public updatedAt!: Date;

    // Association method
    public static associate() {
        Expense.belongsTo(School, {foreignKey: 'schoolId', as: 'school'})
    }
}

export const initExpenseModel = (sequelize: Sequelize): void => {
    Expense.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            amount: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            remarks: {
                type: DataTypes.STRING,
                allowNull: false
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'User',
                    key: 'id'
                }
            },
            schoolId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'School',
                    key: 'id'
                }
            },
            category: {
                type: DataTypes.ENUM(...Object.values(ExpenseCateogy)),
                allowNull: false
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

    // Call association method
    Expense.associate();
}