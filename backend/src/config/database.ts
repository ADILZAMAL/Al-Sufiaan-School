import {Sequelize} from 'sequelize'
import School, {initSchoolModel} from '../models/School';
import {initUserModel} from '../models/User'
import User from '../models/User'
import "dotenv/config";

const sequelize = new Sequelize(process.env.DB_NAME || '', process.env.DB_USER || '', process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: (msg) => {
        console.log(msg);
    },
});

//Initialize School Model
initSchoolModel(sequelize)
initUserModel(sequelize)
// User.init(sequelize)

//Sync the Model with the database
sequelize.sync()
    .then(() => {
        console.log('Database synced!')
    })
    .catch(err => {
        console.log('Error syncing database: ', err)
    })

export default sequelize;