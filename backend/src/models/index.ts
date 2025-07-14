import School from './School';
import User from './User';
import Class from './Class';
import Section from './Section';
import Product from './Product';
import Transaction from './Transaction';
import Expense from './Expense';

// School associations
School.hasMany(User, { foreignKey: 'schoolId', as: 'users' });
School.hasMany(Class, { foreignKey: 'schoolId', as: 'classes' });
School.hasMany(Product, { foreignKey: 'schoolId', as: 'products' });
School.hasMany(Expense, { foreignKey: 'schoolId', as: 'expenses' });

// User associations
User.belongsTo(School, { foreignKey: 'schoolId', as: 'userSchool' });
User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses' });

// Class associations
Class.belongsTo(School, { foreignKey: 'schoolId', as: 'classSchool' });
Class.hasMany(Section, { foreignKey: 'classId', as: 'sections' });

// Section associations
Section.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// Product associations
Product.belongsTo(School, { foreignKey: 'schoolId', as: 'productSchool' });
Product.hasMany(Transaction, { foreignKey: 'productId', as: 'transactions' });

// Transaction associations
Transaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Expense associations
Expense.belongsTo(School, { foreignKey: 'schoolId', as: 'expenseSchool' });
Expense.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { School, User, Class, Section, Product, Transaction, Expense };
