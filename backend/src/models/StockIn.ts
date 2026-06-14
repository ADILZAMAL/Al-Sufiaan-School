import { Model, DataTypes, Sequelize } from 'sequelize';
import Product from './Product';
import User from './User';
import School from './School';

class StockIn extends Model {
  public id!: number;
  public productId!: number;
  public quantity!: number;
  public note!: string | null;
  public userId!: number;
  public schoolId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initStockInModel = (sequelize: Sequelize): void => {
  StockIn.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      note: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'id'
        }
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
      modelName: 'StockIn',
    }
  );
};

export default StockIn;
