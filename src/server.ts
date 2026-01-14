import express from 'express'
import cookieParser from 'cookie-parser'
import cors, { CorsOptions } from 'cors'
import { connectDB } from './lib/connect-db';
import { appRouter } from './routes';


const corsOptions: CorsOptions = {};
const app = express();

(async () => {
    // ! APP LEVEL MIDDLEWARES
    app.use(cookieParser()).use(express.urlencoded({ extended: true })).use(cors(corsOptions)).use(express.json());

    // ! REGISTERING ROUTES

    app.use('/api', appRouter)


    // ! DB CONNECTION
    await connectDB();

    // ! Global Middleware for Errors
})()