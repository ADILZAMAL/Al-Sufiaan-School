import School from './School';
import User from './User';
import Class from './Class';
import Section from './Section';
import Product from './Product';
import Transaction from './Transaction';
import Expense from './Expense';
import ExpenseCategory from './ExpenseCategory';
import TransactionItem from './TransactionItem';
import Staff from './Staff';
import Payslip from './Payslip';
import PayslipPayment from './PayslipPayment';
import Vendor from './Vendor';
import VendorBill from './VendorBill';
import VendorPayment from './VendorPayment';
import ClassFeePricing from './ClassFeePricing';
import TransportationAreaPricing from './TransportationAreaPricing';
import Student from './Student';
import AcademicSession from './AcademicSession';
import StudentEnrollment from './StudentEnrollment';
import StudentMonthlyFee from './StudentMonthlyFee';
import StudentMonthlyFeeItem from './StudentMonthlyFeeItem';
import StudentFeePayment from './StudentFeePayment';
import Attendance from './Attendance';
import Holiday from './Holiday';

// School associations
School.hasMany(User, { foreignKey: 'schoolId', as: 'users' });
School.hasMany(Class, { foreignKey: 'schoolId', as: 'classes' });
School.hasMany(Product, { foreignKey: 'schoolId', as: 'products' });
School.hasMany(Expense, { foreignKey: 'schoolId', as: 'expenses' });
School.hasMany(ExpenseCategory, { foreignKey: 'schoolId', as: 'expenseCategories' });
School.hasMany(Staff, { foreignKey: 'schoolId', as: 'staff' });
School.hasMany(Payslip, { foreignKey: 'schoolId', as: 'payslips' });
School.hasMany(PayslipPayment, { foreignKey: 'schoolId', as: 'payslipPayments' });
School.hasMany(Vendor, { foreignKey: 'schoolId', as: 'vendors' });
School.hasMany(VendorBill, { foreignKey: 'schoolId', as: 'vendorBills' });
School.hasMany(VendorPayment, { foreignKey: 'schoolId', as: 'vendorPayments' });
School.hasMany(ClassFeePricing, { foreignKey: 'schoolId', as: 'classFeePricing' });
School.hasMany(TransportationAreaPricing, { foreignKey: 'schoolId', as: 'transportationAreaPricing' });
School.hasMany(Student, { foreignKey: 'schoolId', as: 'students' });
School.hasMany(Attendance, { foreignKey: 'schoolId', as: 'attendances' });
School.hasMany(Holiday, { foreignKey: 'schoolId', as: 'holidays' });
School.hasMany(AcademicSession, { foreignKey: 'schoolId', as: 'academicSessions' });

// User associations
User.belongsTo(School, { foreignKey: 'schoolId', as: 'School' });
User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses' });
User.hasMany(Payslip, { foreignKey: 'generatedBy', as: 'generatedPayslips' });
User.hasMany(PayslipPayment, { foreignKey: 'paidBy', as: 'paymentsMade' });
User.hasMany(Attendance, { foreignKey: 'markedBy', as: 'markedAttendances' });
User.hasMany(Holiday, { foreignKey: 'createdBy', as: 'createdHolidays' });

// Class associations
Class.belongsTo(School, { foreignKey: 'schoolId', as: 'classSchool' });
Class.hasMany(Section, { foreignKey: 'classId', as: 'sections' });
Class.hasMany(ClassFeePricing, { foreignKey: 'classId', as: 'feePricing' });

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
Transaction.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });

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

// Staff associations
Staff.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

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

// ClassFeePricing associations
ClassFeePricing.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
ClassFeePricing.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// TransportationAreaPricing associations
TransportationAreaPricing.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// Student associations
Student.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
Student.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Student.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// StudentMonthlyFee associations
StudentMonthlyFee.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
StudentMonthlyFee.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
StudentMonthlyFee.hasMany(StudentMonthlyFeeItem, { foreignKey: 'studentMonthlyFeeId', as: 'feeItems' });

// StudentMonthlyFeeItem associations
StudentMonthlyFeeItem.belongsTo(StudentMonthlyFee, { foreignKey: 'studentMonthlyFeeId', as: 'studentMonthlyFee' });

// Additional School associations
School.hasMany(StudentMonthlyFee, { foreignKey: 'schoolId', as: 'studentMonthlyFees' });

// Additional Student associations
Student.hasMany(StudentMonthlyFee, { foreignKey: 'studentId', as: 'monthlyFees' });
Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendances' });

// StudentFeePayment associations
StudentFeePayment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
StudentFeePayment.belongsTo(StudentMonthlyFee, { foreignKey: 'studentMonthlyFeeId', as: 'studentMonthlyFee' });
StudentFeePayment.belongsTo(User, { foreignKey: 'receivedBy', as: 'receiver' });
StudentFeePayment.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });
StudentFeePayment.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// Additional associations for StudentFeePayment
Student.hasMany(StudentFeePayment, { foreignKey: 'studentId', as: 'feePayments' });
StudentMonthlyFee.hasMany(StudentFeePayment, { foreignKey: 'studentMonthlyFeeId', as: 'payments' });
School.hasMany(StudentFeePayment, { foreignKey: 'schoolId', as: 'studentFeePayments' });

// Attendance associations
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Attendance.belongsTo(User, { foreignKey: 'markedBy', as: 'markedByUser' });
Attendance.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// Holiday associations
Holiday.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
Holiday.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// AcademicSession associations
AcademicSession.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
AcademicSession.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
AcademicSession.hasMany(Class, { foreignKey: 'sessionId', as: 'classes' });
AcademicSession.hasMany(StudentEnrollment, { foreignKey: 'sessionId', as: 'enrollments' });
AcademicSession.hasMany(Attendance, { foreignKey: 'sessionId', as: 'sessionAttendances' });
AcademicSession.hasMany(StudentMonthlyFee, { foreignKey: 'sessionId', as: 'monthlyFees' });

// Class session association (sessionId added to class table)
Class.belongsTo(AcademicSession, { foreignKey: 'sessionId', as: 'session' });

// StudentEnrollment associations
StudentEnrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
StudentEnrollment.belongsTo(AcademicSession, { foreignKey: 'sessionId', as: 'session' });
StudentEnrollment.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
StudentEnrollment.belongsTo(Section, { foreignKey: 'sectionId', as: 'section' });
StudentEnrollment.belongsTo(User, { foreignKey: 'promotedBy', as: 'promoter' });
Student.hasMany(StudentEnrollment, { foreignKey: 'studentId', as: 'enrollments' });

export { School, User, Class, Section, Product, Transaction, Expense, ExpenseCategory, TransactionItem, Staff, Payslip, PayslipPayment, Vendor, VendorBill, VendorPayment, ClassFeePricing, TransportationAreaPricing, Student, AcademicSession, StudentEnrollment, StudentMonthlyFee, StudentMonthlyFeeItem, StudentFeePayment, Attendance, Holiday };
