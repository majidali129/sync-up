import { USER_ROLE } from "@/types/user";
import { ApiError } from "@/utils/api-error";
import { asyncHandler } from "@/utils/async-handler";



export const authorize = (roles: USER_ROLE[]) => {
    asyncHandler(async (req, _, next) => {
        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, 'FORBIDDEN: Access Denied')
        };
        next()
    })
}