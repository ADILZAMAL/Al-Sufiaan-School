import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import Class from './Class';

class ClassFeePricing extends Model {
    public id!: number;
    public classId!: number;
    public amount!: number;
    public isActive!: boolean;
    public schoolId!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Virtual fields for associations
    public readonly class?: any;
}

export const initClassFeePricingModel = (sequelize: Sequelize): void => {
    ClassFeePricing.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            classId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: Class,
                    key: 'id'
                }
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0
                }
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
            modelName: 'ClassFeePricing',
            tableName: 'class_fee_pricing',
            indexes: [
                {
                    name: 'class_fee_pricing_school_index',
                    fields: ['schoolId']
                },
                {
                    name: 'class_fee_pricing_class_index',
                    fields: ['classId']
                },
                {
                    name: 'class_fee_pricing_active_index',
                    fields: ['isActive']
                },
                {
                    name: 'class_fee_pricing_unique_constraint',
                    unique: true,
                    fields: ['classId', 'schoolId']
                }
            ],
        }
    );
};

export default ClassFeePricing;
