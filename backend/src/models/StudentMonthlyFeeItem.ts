import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from "sequelize";
import sequelize from "../config/database";
import StudentMonthlyFee from "./StudentMonthlyFee";
import FeeCategory from "./FeeCategory";

export interface StudentMonthlyFeeItemCreationAttributes {
  feeCategoryId: number;
  amount: number;
}
class StudentMonthlyFeeItem extends Model {
    public id!: number;
    public studentMonthlyFeeId!: number;
    public feeCategoryId!: number | null;
    public amount!: number;
}

export const initStudentMonthlyFeeItemModel = (sequelize: Sequelize) => {
  StudentMonthlyFeeItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      studentMonthlyFeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: StudentMonthlyFee,
          key: "id",
          },
          onDelete: "RESTRICT",
          onUpdate: 'CASCADE'
        },
      feeCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: FeeCategory,
          key: "id",
        },
        onDelete: "SET NULL"
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'StudentMonthlyFeeItem',
      tableName: "StudentMonthlyFeeItems",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['studentMonthlyFeeId', 'feeCategoryId'],
          name: 'student_monthly_fee_item_unique',
        },
        {
          fields: ['studentMonthlyFeeId'],
          name: 'student_monthly_fee_item_fee_category_id_idx',
        }
      ]
    })
};

export default StudentMonthlyFeeItem;
