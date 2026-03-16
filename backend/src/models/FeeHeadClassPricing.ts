import { Model, DataTypes, Sequelize } from 'sequelize';
import FeeHead from './FeeHead';
import Class from './Class';

class FeeHeadClassPricing extends Model {
    public id!: number;
    public feeHeadId!: number;
    public classId!: number;
    public schoolId!: number;
    public amount!: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initFeeHeadClassPricingModel = (sequelize: Sequelize) => {
    FeeHeadClassPricing.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        feeHeadId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        classId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        schoolId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        sequelize,
        tableName: 'FeeHeadClassPricing',
    });
};

export default FeeHeadClassPricing;
