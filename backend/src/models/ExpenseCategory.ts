import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';

class ExpenseCategory extends Model {
    public id!: number;
    public name!: string;
    public schoolId!: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initExpenseCategoryModel = (sequelize: Sequelize) => {
    ExpenseCategory.init(
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
                    len: [1, 50]
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
            modelName: 'ExpenseCategory',
            indexes: [
                {
                    unique: true,
                    fields: ['name', 'schoolId'],
                    name: 'unique_category_per_school'
                }
            ]
        }
    );
};

export default ExpenseCategory;
