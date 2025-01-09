import express, {Request, Response} from 'express';
import cors from 'cors';
import "dotenv/config";
import schoolRouter from './routes/school';
import userRouter from './routes/user';
import authRouter from './routes/auth';
import classRouter from './routes/class';
import productRouter from './routes/product'
import sectionRouter from './routes/section'
import transactionRouter from './routes/transaction'
import sequelize from './config/database';
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }));

//Authenticate connection
sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.')
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
      })

app.get("/api/test", async (req: Request, res: Response) => {
    res.json({message: "Hello from express endpoint!"})
})

app.use("/api/schools", schoolRouter)
app.use("/api/users", userRouter)
app.use("/api/auth", authRouter)
app.use("/api/classes", classRouter)
app.use("/api/products", productRouter)
app.use("/api/sections", sectionRouter)
app.use("/api/transactions", transactionRouter)

app.listen(7000, async () => {
    console.log("Server is running on port 7000")
})