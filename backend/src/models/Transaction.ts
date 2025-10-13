import { Model, DataTypes, Sequelize } from 'sequelize';
import School from './School';
import Product from './Product';
import TransactionItem from './TransactionItem';
import Class from './Class';
import Section from './Section';
import User from './User';

class Transaction extends Model {
  public id!: number;
  public studentName!: string;
  public class!: string;
  public classId!: number;
  public sectionId!: number;
  public modeOfPayment!: string;
  public userId!: number;
  public schoolId!: number;
  public isVerified!: boolean;
  public verifiedBy!: number | null;
  public verifiedAt!: Date | null;
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
      classId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Class,
          key: 'id'
        }
      },
      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Section,
          key: 'id'
        }
      },
      modeOfPayment: {
        type: DataTypes.STRING,
        allowNull: false,
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
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: User,
          key: 'id'
        }
      },
      verifiedAt: {
        type: DataTypes.DATE,
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
      modelName: 'Transaction',
    }
  );
};

export default Transaction;
