import {Sequelize} from 'sequelize'
import School, {initSchoolModel} from '../models/School';
import {initUserModel} from '../models/User';
import Class from '../models/Class'
import {initSectionModel} from '../models/Section'
import {initProductModel} from '../models/Product'
import {initTransactionModel} from '../models/Transaction'
import {initTransactionItemModel} from '../models/TransactionItem';
import {initStaffModel} from '../models/Staff';
import {initPayslipModel} from '../models/Payslip';
import {initPayslipPaymentModel} from '../models/PayslipPayment';
import {initExpenseModel} from '../models/Expense';
import {initExpenseCategoryModel} from '../models/ExpenseCategory';
import {initVendorModel} from '../models/Vendor';
import {initVendorBillModel} from '../models/VendorBill';
import {initVendorPaymentModel} from '../models/VendorPayment';
import {initClassFeePricingModel} from '../models/ClassFeePricing';
import {initTransportationAreaPricingModel} from '../models/TransportationAreaPricing';
import {initStudentModel} from "../models/Student"
import {initStudentMonthlyFeeModel} from "../models/StudentMonthlyFee"
import {initStudentMonthlyFeeItemModel} from "../models/StudentMonthlyFeeItem"
import {initStudentFeePaymentModel} from "../models/StudentFeePayment"
import {initAttendanceModel} from "../models/Attendance"
import {initHolidayModel} from "../models/Holiday"
import "dotenv/config";

const sequelize = new Sequelize(process.env.DB_NAME || '', process.env.DB_USER || '', process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    define: {
        freezeTableName: true
    },
    logging: (msg) => {
        console.log(msg);
    },
});

// Class.init(sequelize)
// console.log(Class)

initSchoolModel(sequelize)
initUserModel(sequelize)
// initClassModel(sequelize)
initSectionModel(sequelize)
initProductModel(sequelize)
initTransactionModel(sequelize)
initTransactionItemModel(sequelize);
initExpenseCategoryModel(sequelize);
initExpenseModel(sequelize);
initStaffModel(sequelize);
initPayslipModel(sequelize);
initPayslipPaymentModel(sequelize);
initVendorModel(sequelize);
initVendorBillModel(sequelize);
initVendorPaymentModel(sequelize);
initClassFeePricingModel(sequelize);
initTransportationAreaPricingModel(sequelize);
initStudentModel(sequelize);
initStudentMonthlyFeeModel(sequelize);
initStudentMonthlyFeeItemModel(sequelize);
initStudentFeePaymentModel(sequelize);
initAttendanceModel(sequelize);
initHolidayModel(sequelize);
//Sync the Model with the database
sequelize.sync()
    .then(() => {
        console.log('Database synced!')
    })
    .catch(err => {
        console.log('Error syncing database: ', err)
    })

export default sequelize;
