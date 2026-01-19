import dotEnv from 'dotenv'
dotEnv.config();


export const config = {
    PORT: process.env.PORT!,
    NODE_ENV: process.env.NODE_ENV!,
    DATABASE_URI: process.env.DATABASE_URI!,
    DB_NAME: process.env.DB_NAME!,
    APP_NAME: process.env.APP_NAME!,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS!.split(','),
    DEFAULT_RESPONSE_LIMIT: process.env.DEFAULT_RESPONSE_LIMIT!,
    DEFAULT_RESPONSE_OFFSET: process.env.DEFAULT_RESPONSE_OFFSET!,
    RESEND_API_KEY: process.env.RESEND_API_KEY!,
    EMAIL_FROM: process.env.EMAIL_FROM!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
    CLOUDINARY_URL: process.env.CLOUDINARY_URL!,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY!,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY!,
    SECRET_KEY: process.env.SECRET_KEY!
}

export const env = config;