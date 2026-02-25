import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import Section from './Section';
import AcademicSession from './AcademicSession';
import sequelize from '../config/database';

// class Class extends Model {
//     public id!: number;
//     public name!: string;
//     public schoolId!: number; //Foreign Key
//     public readonly createdAt!: Date;
//     public readonly updatedAt!: Date;
// }

const Class = sequelize.define('class', {
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
    sessionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: AcademicSession,
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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
})

// module.exports = Class

export default Class;
