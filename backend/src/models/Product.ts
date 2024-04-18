import {Model, DataTypes, Sequelize} from 'sequelize'
import School from './School';

class Product extends Model {
    public id!: number;
    public name!: string;
    public description!: string;
    public price!: number;
    public schoolId!: number;
    public buyPrice!: number;
    public readonly createdAt !: Date;
    public readonly updatedAt !: Date;
}

export const initProductModel = (sequelize: Sequelize): void => {
    Product.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            price: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            schoolId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: School,
                    key: 'id'
                }
            },
            buyPrice: {
                type: DataTypes.FLOAT,
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
            modelName: 'Product'
        }
    )
    Product.belongsTo(School, {foreignKey: 'schoolId', as: 'school'})
}

export default Product;