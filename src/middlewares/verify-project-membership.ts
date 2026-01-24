import { Project } from "@/models/project-model";
import { ApiError } from "@/utils/api-error";
import { asyncHandler } from "@/utils/async-handler";



export const verifyProjectMembership = asyncHandler(async (req, _, next) => {
    const userId = req.user.id;
    const workspaceId = req.params.workspaceId;
    const projectId = req.params.projectId;
    const workspaceMember = req.user.workspaceMember;
    if (!workspaceMember) {
        throw new ApiError(403, 'Access denied. You are not a member of this workspace.');
    }

    if (workspaceMember.role === 'owner') {
        req.isProjectMember = true;
        return next();
    }

    const isMember = await Project.findOne({
        _id: projectId,
        workspaceId: workspaceId,
        members: {
            $in: [userId]
        }
    });

    if (!isMember) {
        throw new ApiError(403, 'Access denied. You are not a member of this project.');
    };
    req.isProjectMember = true;
    next()
})