import { WorkspaceMember } from "@/models/workspace-member";
import { ApiError } from "@/utils/api-error";
import { asyncHandler } from "@/utils/async-handler"



type Role = 'owner' | 'admin' | 'member' | 'viewer';
export const verifyWorkspaceOwnerShip = (requiredRole: Role | Role[]) => {
    return asyncHandler(async (req, _, next) => {
        const { workspaceId } = req.params;
        const userId = req.user.id;
        const member = await WorkspaceMember.findOne({
            workspaceId, userId,
            role: Array.isArray(requiredRole) ? { $in: requiredRole } : requiredRole
        }).lean().exec();
        if (!member) {
            const roleText = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
            throw new ApiError(403, `Forbidden: You must be a ${roleText} of this workspace to perform this action`);
        }
        req.user.role = member.role;
        next();
    })
}