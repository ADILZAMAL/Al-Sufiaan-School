import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from "sequelize";
import sequelize from "../config/database";
import StudentMonthlyFee from "./StudentMonthlyFee";

export enum FeeItemType {
  TUITION_FEE = 'TUITION_FEE',
  HOSTEL_FEE = 'HOSTEL_FEE',
  TRANSPORT_FEE = 'TRANSPORT_FEE',
  ADMISSION_FEE = 'ADMISSION_FEE',
  DAYBOARDING_FEE = 'DAYBOARDING_FEE'
}

export interface StudentMonthlyFeeItemCreationAttributes {
  feeType: FeeItemType;
  amount: number;
}
class StudentMonthlyFeeItem extends Model {
    public id!: number;
    public studentMonthlyFeeId!: number;
    public feeType!: FeeItemType;
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
      feeType: {
        type: DataTypes.ENUM(...Object.values(FeeItemType)),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      }
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
          fields: ['studentMonthlyFeeId', 'feeType'],
          name: 'student_monthly_fee_item_unique',
        },
        {
          fields: ['studentMonthlyFeeId'],
          name: 'student_monthly_fee_item_type_idx',
        }
      ]
    })
};

export default StudentMonthlyFeeItem;
