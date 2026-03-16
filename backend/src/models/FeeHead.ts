import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';

class FeeHead extends Model {
    public id!: number;
    public schoolId!: number;
    public name!: string;
    public description!: string | null;
    public frequency!: 'MONTHLY' | 'ONE_TIME';
    public pricingType!: 'FLAT' | 'PER_CLASS' | 'AREA_BASED' | 'CUSTOM';
    public applicability!: 'AUTO' | 'OPT_IN';
    public flatAmount!: number | null;
    public isActive!: boolean;
    public displayOrder!: number;
    public legacyType!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initFeeHeadModel = (sequelize: Sequelize) => {
    FeeHead.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        schoolId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        frequency: {
            type: DataTypes.ENUM('MONTHLY', 'ONE_TIME'),
            allowNull: false,
        },
        pricingType: {
            type: DataTypes.ENUM('FLAT', 'PER_CLASS', 'AREA_BASED', 'CUSTOM'),
            allowNull: false,
        },
        applicability: {
            type: DataTypes.ENUM('AUTO', 'OPT_IN'),
            allowNull: false,
        },
        flatAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        legacyType: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
    }, {
        sequelize,
        tableName: 'FeeHeads',
    });
};

export default FeeHead;
