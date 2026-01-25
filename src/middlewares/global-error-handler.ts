import { config } from '@/config/env';
import { ApiError } from '@/utils/api-error';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

const formatErrors = (err: ZodError) => {
    return err.issues?.map((iss) => ({
        field: iss.path.join('.'),
        message: iss.message,
        code: iss.code
    }));
}
const sendDevError = (res: Response, err: any) => {
    console.log('DEV ERROR 💥', err);
    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        errors: formatErrors(err),
        stack: err.stack,
        err: err,
    })
}

const sendProdError = (res: Response, err: ApiError) => {
    // Operational, trusted error: send meaningful message to client
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: 'fail',
            message: err.message,
            errors: err.errors
        })
        // Programming or other unknown error: don't leak error details to client
    } else {
        // 1) Log error
        console.error('ERROR 💥', err);
        // 2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        })
    }
}

const handleValidationError = (err: ZodError) => {
    const formattedErrors = formatErrors(err);
    return new ApiError(400, 'Validation Error', formattedErrors);
};

const handleDuplicateFieldError = (err: any) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new ApiError(400, message);
}


export const globalErrorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.NODE_ENV.trim() === 'development') {
        sendDevError(res, err)
    } else if (config.NODE_ENV === 'production') {
        console.log('PROD ERROR 💥', err);
        let error = { ...err, message: err.message, name: err.name };

        if (err instanceof ZodError) {
            error = handleValidationError(err)
        }
        // mongoose duplicate key error
        if (err.code === 11000) {
            error = handleDuplicateFieldError(err);
        }

        sendProdError(res, error)
    };
}