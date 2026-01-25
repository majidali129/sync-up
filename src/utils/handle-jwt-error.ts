import { JWTClaimValidationFailed, JWTExpired, JWTInvalid } from "jose/errors";
import { ApiError } from "./api-error";


export const handleJWTError = (err: any): ApiError => {
    if (err instanceof JWTExpired) {
        return new ApiError(401, 'Your session has expired! Please log in again.');
    }
    if (err instanceof JWTInvalid || err instanceof JWTClaimValidationFailed) {
        return new ApiError(401, 'Invalid token. Please log in again.');
    }
    return err;
}