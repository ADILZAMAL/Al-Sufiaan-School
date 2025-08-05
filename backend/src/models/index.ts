import School from './School';
import User from './User';
import Class from './Class';
import Section from './Section';
import Product from './Product';
import Transaction from './Transaction';
import Expense from './Expense';
import TransactionItem from './TransactionItem';
import TeachingStaff from './TeachingStaff';
import NonTeachingStaff from './NonTeachingStaff';
import Payslip from './Payslip';

// School associations
School.hasMany(User, { foreignKey: 'schoolId', as: 'users' });
School.hasMany(Class, { foreignKey: 'schoolId', as: 'classes' });
School.hasMany(Product, { foreignKey: 'schoolId', as: 'products' });
School.hasMany(Expense, { foreignKey: 'schoolId', as: 'expenses' });
School.hasMany(TeachingStaff, { foreignKey: 'schoolId', as: 'teachingStaff' });
School.hasMany(NonTeachingStaff, { foreignKey: 'schoolId', as: 'nonTeachingStaff' });

// User associations
User.belongsTo(School, { foreignKey: 'schoolId', as: 'userSchool' });
User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses' });

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

// TeachingStaff associations
TeachingStaff.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// NonTeachingStaff associations
NonTeachingStaff.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// Payslip associations
Payslip.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
Payslip.belongsTo(User, { foreignKey: 'generatedBy', as: 'generatedByUser' });
School.hasMany(Payslip, { foreignKey: 'schoolId', as: 'payslips' });
User.hasMany(Payslip, { foreignKey: 'generatedBy', as: 'generatedPayslips' });

export { School, User, Class, Section, Product, Transaction, Expense, TransactionItem, TeachingStaff, NonTeachingStaff, Payslip };
