export class ApiError extends Error {
    status: 'error' | 'fail';
    statusCode: number;
    errors: any;
    isOperational: boolean;
    constructor(statusCode: number, message: string, errors?: any[]) {
        super(message);
        this.status = `${statusCode}`.startsWith('4') ? 'error' : 'fail';
        this.isOperational = true;
        this.statusCode = statusCode;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
};