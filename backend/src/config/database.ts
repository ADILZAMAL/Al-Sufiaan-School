import {Sequelize} from 'sequelize'
import School, {initSchoolModel} from '../models/School';
import {initUserModel} from '../models/User';
import Class from '../models/Class'
import Section from '../models/Section'
import {initProductModel} from '../models/Product'
import {initTransactionModel} from '../models/Transaction'
// import {initExpenseModel} from '../models/Expense'
import {initTransactionItemModel} from '../models/TransactionItem';
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
// initSectionModel(sequelize)
initProductModel(sequelize)
initTransactionModel(sequelize)
initTransactionItemModel(sequelize);
//Sync the Model with the database
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database synced!')
    })
    .catch(err => {
        console.log('Error syncing database: ', err)
    })

export default sequelize;
