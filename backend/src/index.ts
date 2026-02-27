import express, {Request, Response} from 'express';
import cors from 'cors';
import "dotenv/config";
import logger from './utils/logger';
import { requestIdMiddleware, httpLogger } from './middleware/requestLogger';
import { globalErrorHandler } from './middleware/errorHandler';
import schoolRouter from './routes/school';
import userRouter from './routes/user';
import authRouter from './routes/auth';
import classRouter from './routes/class';
import productRouter from './routes/product'
import sectionRouter from './routes/section'
import transactionRouter from './routes/transaction'
import expenseRouter from './routes/expense'
import expenseCategoryRouter from './routes/expenseCategory'
import staffRouter from './routes/staff'
import photoUploadRouter from './routes/photoUpload'
import payslipRouter from './routes/payslip'
import vendorRouter from './routes/vendor'
import vendorBillRouter from './routes/vendorBill'
import vendorPaymentRouter from './routes/vendorPayment'
import classFeePricingRouter from './routes/classFeePricing'
import transportationAreaPricingRouter from './routes/transportationAreaPricing'
import studentRouter from './routes/student'
import monthlyFeeRouter from './routes/monthlyFee'
import attendanceRouter from './routes/attendance'
import holidayRouter from './routes/holiday'
import academicSessionRouter from './routes/academicSession'
import enrollmentRouter from './routes/studentEnrollment'
import sequelize from './config/database';
import './models'; // Import for associations
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

// Trust proxy for Render and other hosting platforms
// This ensures req.secure and req.protocol work correctly behind proxies
app.set('trust proxy', 1);

// CORS must be configured before other middleware
app.use(cors({
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }
        
        const allowedOrigins = [
            // Development origins
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
            // Production origins
            'https://alsufiaanschool.in',
            'https://www.alsufiaanschool.in',
            // Environment variable (fallback)
            process.env.FRONTEND_URL
        ].filter(Boolean); 
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        return callback(new Error(`CORS policy violation: Origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Serve static files for uploaded photos
app.use('/uploads', express.static('uploads'));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Al-Sufiaan School API Documentation'
}));

// Request ID + HTTP access logging (must be before routes)
app.use(requestIdMiddleware);
app.use(httpLogger);

//Authenticate connection
sequelize.authenticate()
    .then(() => {
        logger.info('Database connection established successfully');
    })
    .catch(err => {
        logger.error('Unable to connect to the database', { error: err.message, stack: err.stack });
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
app.use('/api/staff', staffRouter)
app.use('/api/photos', photoUploadRouter)
app.use('/api/payslips', payslipRouter)
app.use('/api/vendors', vendorRouter)
app.use('/api/vendor-bills', vendorBillRouter)
app.use('/api/vendor-payments', vendorPaymentRouter)
app.use('/api/class-fee-pricing', classFeePricingRouter)
app.use('/api/transportation-area-pricing', transportationAreaPricingRouter)
app.use('/api/students', studentRouter)
app.use('/api/fees', monthlyFeeRouter)
app.use('/api/attendance', attendanceRouter)
app.use('/api/holidays', holidayRouter)
app.use('/api/sessions', academicSessionRouter)
app.use('/api', enrollmentRouter)

// Global error handler — must be the last middleware
app.use(globalErrorHandler);

const server = app.listen(7000, () => {
    logger.info('Server is running', { port: 7000, env: process.env.NODE_ENV || 'development' });
});

// Graceful shutdown
const shutdown = (signal: string) => {
    logger.info(`${signal} received — starting graceful shutdown`);
    server.close(() => {
        logger.info('HTTP server closed');
        sequelize.close()
            .then(() => {
                logger.info('Database connection closed. Exiting.');
                process.exit(0);
            })
            .catch((err) => {
                logger.error('Error closing database connection during shutdown', { error: err.message });
                process.exit(1);
            });
    });
    // Force exit after 10s if graceful shutdown stalls
    setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM')); // Render sends SIGTERM on deploy
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C in development

process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    logger.error('Unhandled rejection', { reason: message });
    shutdown('unhandledRejection');
});
