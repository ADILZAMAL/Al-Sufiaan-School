import School from './School';
import User from './User';
import Class from './Class';
import Section from './Section';
import Product from './Product';
import Transaction from './Transaction';
import Expense from './Expense';
import ExpenseCategory from './ExpenseCategory';
import TransactionItem from './TransactionItem';
import TeachingStaff from './TeachingStaff';
import NonTeachingStaff from './NonTeachingStaff';
import Payslip from './Payslip';
import PayslipPayment from './PayslipPayment';
import Vendor from './Vendor';
import VendorBill from './VendorBill';
import VendorPayment from './VendorPayment';
import FeeCategory from './FeeCategory';

// School associations
School.hasMany(User, { foreignKey: 'schoolId', as: 'users' });
School.hasMany(Class, { foreignKey: 'schoolId', as: 'classes' });
School.hasMany(Product, { foreignKey: 'schoolId', as: 'products' });
School.hasMany(Expense, { foreignKey: 'schoolId', as: 'expenses' });
School.hasMany(ExpenseCategory, { foreignKey: 'schoolId', as: 'expenseCategories' });
School.hasMany(TeachingStaff, { foreignKey: 'schoolId', as: 'teachingStaff' });
School.hasMany(NonTeachingStaff, { foreignKey: 'schoolId', as: 'nonTeachingStaff' });
School.hasMany(Payslip, { foreignKey: 'schoolId', as: 'payslips' });
School.hasMany(PayslipPayment, { foreignKey: 'schoolId', as: 'payslipPayments' });
School.hasMany(Vendor, { foreignKey: 'schoolId', as: 'vendors' });
School.hasMany(VendorBill, { foreignKey: 'schoolId', as: 'vendorBills' });
School.hasMany(VendorPayment, { foreignKey: 'schoolId', as: 'vendorPayments' });
School.hasMany(FeeCategory, { foreignKey: 'schoolId', as: 'feeCategories' });

// User associations
User.belongsTo(School, { foreignKey: 'schoolId', as: 'userSchool' });
User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses' });
User.hasMany(Payslip, { foreignKey: 'generatedBy', as: 'generatedPayslips' });
User.hasMany(PayslipPayment, { foreignKey: 'paidBy', as: 'paymentsMade' });

// Class associations
Class.belongsTo(School, { foreignKey: 'schoolId', as: 'classSchool' });
Class.hasMany(Section, { foreignKey: 'classId', as: 'sections' });

// Section associations
Section.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// Product associations
Product.belongsTo(School, { foreignKey: 'schoolId'});
Product.hasMany(TransactionItem, { foreignKey: 'productId', as : 'items' });

// Transaction associations
Transaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Transaction.hasMany(TransactionItem, { foreignKey: 'transactionId', as: 'items'});
Transaction.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
Transaction.belongsTo(Class, { foreignKey: 'classId', as: 'transactionClass' });
Transaction.belongsTo(Section, { foreignKey: 'sectionId', as: 'transactionSection' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// TransactionItem associations
TransactionItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

// Expense associations
Expense.belongsTo(School, { foreignKey: 'schoolId', as: 'expenseSchool' });
Expense.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Expense.belongsTo(ExpenseCategory, { foreignKey: 'categoryId', as: 'expenseCategory' });
Expense.hasOne(PayslipPayment, { foreignKey: 'expenseId', as: 'payslipPayment' });
Expense.hasOne(VendorPayment, { foreignKey: 'expenseId', as: 'vendorPayment' });

// ExpenseCategory associations
ExpenseCategory.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
ExpenseCategory.hasMany(Expense, { foreignKey: 'categoryId', as: 'expenses' });

// TeachingStaff associations
TeachingStaff.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// NonTeachingStaff associations
NonTeachingStaff.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// Payslip associations
Payslip.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
Payslip.belongsTo(User, { foreignKey: 'generatedBy', as: 'generatedByUser' });
Payslip.hasMany(PayslipPayment, { foreignKey: 'payslipId', as: 'payments' });

// User associations

// PayslipPayment associations
PayslipPayment.belongsTo(Payslip, { foreignKey: 'payslipId', as: 'payslip' });
PayslipPayment.belongsTo(User, { foreignKey: 'paidBy', as: 'paidByUser' });
PayslipPayment.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
PayslipPayment.belongsTo(Expense, { foreignKey: 'expenseId', as: 'expense' });

// Vendor associations
Vendor.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
Vendor.belongsTo(ExpenseCategory, { foreignKey: 'categoryId', as: 'category' });
Vendor.hasMany(VendorBill, { foreignKey: 'vendorId', as: 'bills' });
Vendor.hasMany(VendorPayment, { foreignKey: 'vendorId', as: 'payments' });

// VendorBill associations
VendorBill.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
VendorBill.belongsTo(User, { foreignKey: 'userId', as: 'user' });
VendorBill.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// VendorPayment associations
VendorPayment.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
VendorPayment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
VendorPayment.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
VendorPayment.belongsTo(Expense, { foreignKey: 'expenseId', as: 'expense' });

// FeeCategory associations
FeeCategory.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

export { School, User, Class, Section, Product, Transaction, Expense, ExpenseCategory, TransactionItem, TeachingStaff, NonTeachingStaff, Payslip, PayslipPayment, Vendor, VendorBill, VendorPayment, FeeCategory };
