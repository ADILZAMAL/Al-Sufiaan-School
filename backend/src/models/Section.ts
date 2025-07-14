import { Model, Sequelize, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Class from './Class';
import School from './School';

class Section extends Model {
    public id!: number;
    public name!: string;
    public classId!: number; //Foreign Key
    public schoolId!: number;
    public roomNumber!: number;
    public maxStrength!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Section.init(
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
        classId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Class,
                key: 'id'
            }
        },
        schoolId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references:{
                model: School,
                key: 'id'
            }
        },
        roomNumber: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        maxStrength: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
        modelName: 'Section'
    }
)
export default Section
