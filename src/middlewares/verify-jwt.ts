import { User } from '@/models/user-model';
import { ApiError } from '@/utils/api-error';
import { asyncHandler } from '@/utils/async-handler';
import { verifyToken } from '@/utils/jwts';
import { Request, Response, NextFunction } from 'express';


export const verifyJWT = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const accessToken = req.cookies['access-token'];
    if (!accessToken) throw new ApiError(401, 'Unauthorized: Please log in to access this resource');

    const decoded = await verifyToken(accessToken, 'access')
    const payload = decoded.payload as { id: string, email: string, username: string };

    const currentUser = await User.findById(payload.id).select('+_id +username +email +isEmailVerified').exec();
    if (!currentUser) throw new ApiError(401, 'Unauthorized: Please log in to access this resource');

    //TODO: Check if user update his password after the token was issued

    req.user = {
        id: currentUser._id.toString(),
        username: currentUser.username,
        email: currentUser.email,
        fullName: currentUser.fullName
    }
    next()
})