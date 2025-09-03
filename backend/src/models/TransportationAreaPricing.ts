import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import FeeCategory from './FeeCategory';

class TransportationAreaPricing extends Model {
    public id!: number;
    public areaName!: string;
    public price!: number;
    public feeCategoryId!: number;
    public academicYear!: string;
    public effectiveFrom!: Date;
    public effectiveTo!: Date;
    public isActive!: boolean;
    public schoolId!: number;
    public description?: string;
    public displayOrder!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Associated data
    public readonly feeCategory?: any;
    public readonly school?: any;
}

export const initTransportationAreaPricingModel = (sequelize: Sequelize): void => {
    TransportationAreaPricing.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            areaName: {
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 100]
                }
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0
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
            academicYear: {
                type: DataTypes.STRING(10),
                allowNull: false,
                validate: {
                    is: /^\d{4}-\d{2}$/,
                    notEmpty: true
                }
            },
            effectiveFrom: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            effectiveTo: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isAfterEffectiveFrom(this: TransportationAreaPricing, value: Date) {
                        if (value <= this.effectiveFrom) {
                            throw new Error('Effective To date must be after Effective From date');
                        }
                    }
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
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            displayOrder: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
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
            modelName: 'TransportationAreaPricing',
            tableName: 'transportation_area_pricing',
            indexes: [
                {
                    name: 'transportation_area_pricing_school_index',
                    fields: ['schoolId']
                },
                {
                    name: 'transportation_area_pricing_fee_category_index',
                    fields: ['feeCategoryId']
                },
                {
                    name: 'transportation_area_pricing_academic_year_index',
                    fields: ['academicYear']
                },
                {
                    name: 'transportation_area_pricing_active_index',
                    fields: ['isActive']
                },
                {
                    name: 'transportation_area_pricing_display_order_index',
                    fields: ['displayOrder']
                },
                {
                    unique: true,
                    fields: ['areaName', 'feeCategoryId', 'academicYear', 'schoolId'],
                    name: 'unique_area_fee_category_year_school'
                }
            ]
        }
    );
};

export default TransportationAreaPricing;
