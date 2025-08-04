import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import Product from './Product';
import TransactionItem from './TransactionItem';

class Transaction extends Model {
  public id!: number;
  public studentName!: string;
  public class!: string;
  public modeOfPayment!: string;
  public schoolId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // public static associate(models: any) {
    // one-to-many relationship with TransactionItem
    // Transaction.hasMany(models.TransactionItem, { foreignKey: 'transactionId'});
    // Transaction.belongsTo(models.School, { foreignKey: 'schoolId', as: 'school' });
    // Transaction.belongsToMany(models.Product, { through: models.TransactionItem });
  // }
}

export const initTransactionModel = (sequelize: Sequelize): void => {
  Transaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      studentName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      class: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      modeOfPayment: {
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
      modelName: 'Transaction',
    }
  );
};

export default Transaction;
