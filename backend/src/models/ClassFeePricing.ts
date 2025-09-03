import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import Class from './Class';
import FeeCategory from './FeeCategory';

class ClassFeePricing extends Model {
    public id!: number;
    public classId!: number;
    public feeCategoryId!: number;
    public amount!: number;
    public academicYear!: string;
    public effectiveFrom!: Date;
    public effectiveTo!: Date;
    public isActive!: boolean;
    public schoolId!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Virtual fields for associations
    public readonly class?: any;
    public readonly feeCategory?: any;
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
            feeCategoryId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: FeeCategory,
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
            academicYear: {
                type: DataTypes.STRING(10),
                allowNull: false,
                validate: {
                    is: /^\d{4}-\d{2}$/ // Format: 2024-25
                }
            },
            effectiveFrom: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            effectiveTo: {
                type: DataTypes.DATEONLY,
                allowNull: false,
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
                    name: 'class_fee_pricing_fee_category_index',
                    fields: ['feeCategoryId']
                },
                {
                    name: 'class_fee_pricing_academic_year_index',
                    fields: ['academicYear']
                },
                {
                    name: 'class_fee_pricing_active_index',
                    fields: ['isActive']
                },
                {
                    name: 'class_fee_pricing_unique_constraint',
                    unique: true,
                    fields: ['classId', 'feeCategoryId', 'academicYear', 'schoolId']
                }
            ],
            validate: {
                effectiveDateRange(this: ClassFeePricing) {
                    if (this.effectiveFrom >= this.effectiveTo) {
                        throw new Error('Effective from date must be before effective to date');
                    }
                }
            }
        }
    );
};

export default ClassFeePricing;
