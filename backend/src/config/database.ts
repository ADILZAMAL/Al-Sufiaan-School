import {Sequelize} from 'sequelize'
import School, {initSchoolModel} from '../models/School';
import {initUserModel} from '../models/User';
import {initClassModel} from '../models/Class'
import {initSectionModel} from '../models/Section'
import {initProductModel} from '../models/Product'
import {initTransactionModel} from '../models/Transaction'
import "dotenv/config";

const sequelize = new Sequelize(process.env.DB_NAME || '', process.env.DB_USER || '', process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: (msg) => {
        console.log(msg);
    },
});

initSchoolModel(sequelize)
initUserModel(sequelize)
initClassModel(sequelize)
initSectionModel(sequelize)
initProductModel(sequelize)
initTransactionModel(sequelize)

//Sync the Model with the database
sequelize.sync()
    .then(() => {
        console.log('Database synced!')
    })
    .catch(err => {
        console.log('Error syncing database: ', err)
    })

export default sequelize;