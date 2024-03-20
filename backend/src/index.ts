import express, {Request, Response} from 'express';
import cors from 'cors';
import "dotenv/config";
import {Sequelize} from 'sequelize'

const sequelize = new Sequelize(process.env.DB_NAME || '', process.env.DB_USER || '', process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
      } catch (error) {
        console.error('Unable to connect to the database:', error);
      }
})();


const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

app.get("/api/test", async (req: Request, res: Response) => {
    res.json({message: "Hello from express endpoint!"})
})

app.listen(7000, async () => {
    console.log("Server is running on port 7000")
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
      } catch (error) {
        console.error('Unable to connect to the database:', error);
      }
})