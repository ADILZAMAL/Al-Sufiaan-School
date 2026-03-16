import { Model, Sequelize, DataTypes } from 'sequelize';
import School from './School';
import AcademicSession from './AcademicSession';

class Class extends Model {
    public id!: number;
    public name!: string;
    public schoolId!: number;
    public sessionId!: number | null;
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
                    key: 'id',
                },
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
            },
        },
        {
            sequelize,
            modelName: 'class',
            freezeTableName: true,
        }
    );
};

export default Class;
