import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';

class Class extends Model {
    public id!: number;
    public name!: string;
    public schoolId!: number; //Foreign Key
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initClassModel = (sequelize: Sequelize): void => {
    Class.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false,
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
            modelName: 'Class'
        }
    )
    Class.belongsTo(School, { foreignKey: 'schoolId', as: 'school' })
}

export default Class;