import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';
import School from './School';
import User from './User';

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
    public category!: ExpenseCateogy;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

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
            allowNull: false,
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
)

export default Expense;
