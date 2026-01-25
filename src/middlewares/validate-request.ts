import { Request, Response, NextFunction } from "express";
import { ZodError, ZodObject } from "zod";

export const validateBody = (schema: ZodObject<any>) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            const result = schema.parse(req.body);
            req.body = result;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return next(error);
            };
            next(error);
        }
    }
}