import dotEnv from 'dotenv'
dotEnv.config();


export const config = {
    PORT: process.env.PORT!,
    NODE_ENV: process.env.NODE_ENV!,
    DATABASE_URI: process.env.DATABASE_URI
}