import { Model, DataTypes, Sequelize } from 'sequelize';

class Designation extends Model {
    public id!: number;
    public name!: string;
    public description!: string | null;
    public schoolId!: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initDesignationModel = (sequelize: Sequelize) => {
    Designation.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        schoolId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
    }, {
        sequelize,
        modelName: 'Designation',
        tableName: 'designations',
        freezeTableName: true,
        indexes: [
            {
                name: 'designation_unique_name_school',
                unique: true,
                fields: ['name', 'schoolId'],
            },
            {
                name: 'designation_school_index',
                fields: ['schoolId'],
            },
        ],
    });
};

export default Designation;
