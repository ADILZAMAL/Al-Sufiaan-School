import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import Expense from './Expense';

class User extends Model {
    public id!: number;
    public email!: string;
    public password!: string;
    public firstName!: string;
    public lastName!: string;
    public schoolId!: number; //Foreign Key
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

       // Association method
    //    public static associate() {
    //     User.hasMany(Expense, { foreignKey: 'userId', as: 'expense' })
    // }
}

export const initUserModel = (sequelize: Sequelize): void => {
    User.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            firstName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            lastName: {
                type: DataTypes.STRING,
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
            modelName: 'User'
        }
    )
    User.belongsTo(School, { foreignKey: 'schoolId', as: 'school' })
    // User.associate()
}

console.log(User.getAttributes())
export default User;