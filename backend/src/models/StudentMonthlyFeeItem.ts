import { DataTypes, Model, Sequelize } from "sequelize";
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
  feeType?: FeeItemType | null;
  feeHeadId: number;
  feeHeadName?: string | null;
  note?: string | null;
  amount: number;
}

class StudentMonthlyFeeItem extends Model {
    public id!: number;
    public studentMonthlyFeeId!: number;
    public feeType!: FeeItemType | null;
    public feeHeadId!: number;
    public feeHeadName!: string | null;
    public note!: string | null;
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
        allowNull: true,
      },
      feeHeadId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      feeHeadName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      note: {
        type: DataTypes.STRING(200),
        allowNull: true,
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
          fields: ['studentMonthlyFeeId', 'feeHeadId'],
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
