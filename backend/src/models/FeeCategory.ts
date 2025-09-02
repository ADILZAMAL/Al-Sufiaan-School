import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';

class FeeCategory extends Model {
    public id!: number;
    public name!: string;
    public pricingType!: 'Fixed' | 'Class-based' | 'Area-based';
    public fixedAmount!: number;
    public feeType!: 'One-time' | 'Annual' | 'Monthly' | 'Quarterly';
    public isRefundable!: boolean;
    public isMandatory!: boolean;
    public displayOrder!: number;
    public isActive!: boolean;
    public schoolId!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initFeeCategoryModel = (sequelize: Sequelize): void => {
    FeeCategory.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            pricingType: {
                type: DataTypes.ENUM('Fixed', 'Class-based', 'Area-based'),
                allowNull: false,
                defaultValue: 'Fixed',
            },
            fixedAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
            },
            feeType: {
                type: DataTypes.ENUM('One-time', 'Annual', 'Monthly', 'Quarterly'),
                allowNull: false,
                defaultValue: 'Annual',
            },
            isRefundable: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            isMandatory: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            displayOrder: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
        },
        {
            sequelize,
            modelName: 'FeeCategory',
            tableName: 'fee_categories',
            indexes: [
                {
                    name: 'fee_category_school_index',
                    fields: ['schoolId']
                },
                {
                    name: 'fee_category_active_index',
                    fields: ['isActive']
                },
                {
                    name: 'fee_category_display_order_index',
                    fields: ['displayOrder']
                }
            ]
        }
    );
};

export default FeeCategory;
