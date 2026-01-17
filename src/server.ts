import express from 'express'
import cookieParser from 'cookie-parser'
import cors, { CorsOptions } from 'cors'
import { appRouter } from './routes';
import { config } from './config/env';
import { createServer } from 'http'

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


const app = express();
export const httpServer = createServer(app);
// ! APP LEVEL MIDDLEWARES
app.use(cookieParser()).use(express.urlencoded({ extended: true })).use(cors(corsOptions)).use(express.json())

// ! REGISTERING APP ROUTES
app.use('/api', appRouter)

// ! Global Middleware for Errors
