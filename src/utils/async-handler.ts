import { NextFunction, RequestHandler, Request, Response } from "express";

// ! JUST TO AVOID REPEATING TRY_CATCH
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => next(err))
}