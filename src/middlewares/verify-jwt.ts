import { User } from '@/models/user-model';
import { ApiError } from '@/utils/api-error';
import { asyncHandler } from '@/utils/async-handler';
import { verifyToken } from '@/utils/jwts';
import { Request, Response, NextFunction } from 'express';
import { JWTClaimValidationFailed, JWTExpired, JWTInvalid } from 'jose/errors';


export const verifyJWT = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const accessToken = req.cookies['access-token'];
    if (!accessToken) throw new ApiError(401, 'Unauthorized: Please log in to access this resource');

    try {
        const decoded = await verifyToken(accessToken, 'access')
        const payload = decoded.payload as { id: string, email: string, username: string };

        const currentUser = await User.findById(payload.id).select('+_id +username +email +isEmailVerified').exec();
        if (!currentUser) throw new ApiError(401, 'Unauthorized: Please log in to access this resource');
        req.user = {
            id: currentUser._id.toString(),
            username: currentUser.username,
            email: currentUser.email,
            fullName: currentUser.fullName,
        }
        return next()
    } catch (err) {
        if (err instanceof JWTExpired) {
            return next(new ApiError(401, 'Your session has expired! Please log in again.'));
        } else if (err instanceof JWTInvalid || err instanceof JWTClaimValidationFailed) {
            return next(new ApiError(401, 'Invalid token. Please log in again.'));
        }
        return next(err);
    }
})