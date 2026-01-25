export class ApiError extends Error {
    status: 'error' | 'fail';
    statusCode: number;
    isOperational: boolean;
    errors: any;
    constructor(statusCode: number, message: string, errors?: any[]) {
        super(message);
        this.status = `${statusCode}`.startsWith('4') ? 'error' : 'fail';
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
};