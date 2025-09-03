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
import expenseRouter from './routes/expense'
import expenseCategoryRouter from './routes/expenseCategory'
import teachingStaffRouter from './routes/teachingStaff'
import nonTeachingStaffRouter from './routes/nonTeachingStaff'
import photoUploadRouter from './routes/photoUpload'
import payslipRouter from './routes/payslip'
import vendorRouter from './routes/vendor'
import vendorBillRouter from './routes/vendorBill'
import vendorPaymentRouter from './routes/vendorPayment'
import feeCategoryRouter from './routes/feeCategory'
import classFeePricingRouter from './routes/classFeePricing'
import transportationAreaPricingRouter from './routes/transportationAreaPricing'
import sequelize from './config/database';
import './models'; // Import for associations
import cookieParser from "cookie-parser";

const app = express();

// CORS must be configured before other middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Serve static files for uploaded photos
app.use('/uploads', express.static('uploads'));

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
app.use('/api/expenses', expenseRouter)
app.use('/api/expense-categories', expenseCategoryRouter)
app.use('/api/teaching-staff', teachingStaffRouter)
app.use('/api/non-teaching-staff', nonTeachingStaffRouter)
app.use('/api/photos', photoUploadRouter)
app.use('/api/payslips', payslipRouter)
app.use('/api/vendors', vendorRouter)
app.use('/api/vendor-bills', vendorBillRouter)
app.use('/api/vendor-payments', vendorPaymentRouter)
app.use('/api/fee-categories', feeCategoryRouter)
app.use('/api/class-fee-pricing', classFeePricingRouter)
app.use('/api/transportation-area-pricing', transportationAreaPricingRouter)

app.listen(7000, async () => {
    console.log("Server is running on port 7000")
})
