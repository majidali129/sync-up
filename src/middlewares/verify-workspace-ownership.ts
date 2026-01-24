import { WorkspaceMember } from "@/models/workspace-member";
import { USER_ROLE } from "@/types/user";
import { ApiError } from "@/utils/api-error";
import { asyncHandler } from "@/utils/async-handler"

export const verifyWorkspaceOwnerShip = (requiredRole: USER_ROLE | USER_ROLE[]) => {
    return asyncHandler(async (req, _, next) => {
        const { workspaceId } = req.params;
        const userId = req.user.id;
        const member = await WorkspaceMember.findOne({
            workspaceId, userId,
            role: Array.isArray(requiredRole) ? { $in: requiredRole } : requiredRole
        }).lean().exec();
        if (!member) {
            const roleText = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
            throw new ApiError(403, `Access denied. You must be a ${roleText} of this workspace.`);
        }
        req.user.workspaceMember = {
            userId: member.userId,
            workspaceId: member.workspaceId,
            role: member.role
        }
        next();
    })
}