import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';

class TransportationAreaPricing extends Model {
    public id!: number;
    public areaName!: string;
    public price!: number;
    public isActive!: boolean;
    public schoolId!: number;
    public description?: string;
    public displayOrder!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Associated data
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
                    name: 'transportation_area_pricing_active_index',
                    fields: ['isActive']
                },
                {
                    name: 'transportation_area_pricing_display_order_index',
                    fields: ['displayOrder']
                },
                {
                    unique: true,
                    fields: ['areaName', 'schoolId'],
                    name: 'unique_area_school'
                }
            ]
        }
    );
};

export default TransportationAreaPricing;
