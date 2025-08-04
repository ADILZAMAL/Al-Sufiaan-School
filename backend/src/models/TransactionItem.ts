import { Model, DataTypes, Sequelize } from 'sequelize';
import Transaction from './Transaction';
import Product from './Product';

class TransactionItem extends Model {
  public id!: number;
  public transactionId!: number;
  public productId!: number;
  public quantity!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initTransactionItemModel = (sequelize: Sequelize): void => {
  TransactionItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      transactionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Transaction,
          key: 'id'
        }
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Product,
          key: 'id'
        }
      },
      quantity: {
        type: DataTypes.INTEGER,
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
      modelName: 'TransactionItem',
    }
  );
};


export default TransactionItem;
