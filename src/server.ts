import express from 'express'
import cookieParser from 'cookie-parser'
import cors, { CorsOptions } from 'cors'
import { appRouter } from './routes';
import { config } from './config/env';
import { createServer } from 'http'
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { globalErrorHandler } from './middlewares/global-error-handler';

const corsOptions: CorsOptions = {
    methods: ["GET", "POST", "DELETE", "PATCH", "HEAD"],
    origin: (origin, cb) => {
        if (!origin) {
            return cb(null, true);
        };

        if (config.ALLOWED_ORIGINS.includes(origin)) {
            return cb(null, true);
        };

        throw new Error(`CORS ERROR: Origin ${origin} is not allowed by the CORS`)
    },
    credentials: true
};

const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 100,
    message: {
        error: 'Too many requests from this IP, please try again later'
        ,
        retryAfter: '10 minutes'
        ,
        upgradeMessage: 'Consider upgrading your plan for higher limits'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'API rate limit exceeded',
            currentPlan: 'free',
            upgradeUrl: 'https://sync-up.com/upgrade',
            retryAfter: Math.round((req as any).rateLimit.resetTime / 1000)
        })
    }
})
const app = express();
export const httpServer = createServer(app);
// ! APP LEVEL MIDDLEWARES
app.use(cookieParser()).use(morgan('dev')).use(express.urlencoded({ extended: true })).use(cors(corsOptions)).use(express.json()).use(helmet())

// ! REGISTERING APP ROUTES
app.use('/api', apiLimiter, appRouter)

// ! Global Middleware for Errors
app.use(globalErrorHandler)
