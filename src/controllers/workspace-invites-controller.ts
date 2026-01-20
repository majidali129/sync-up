import { acceptInviteSchema, workspaceInviteSchema } from "@/schemas/workspace-invite";
import { workspaceInvitesService } from "@/services/workspace-invites-service";
import { apiResponse } from "@/utils/api-response";
import { asyncHandler } from "@/utils/async-handler";

export const sendInvite = asyncHandler(async (req, res) => {
    const result = await workspaceInvitesService.sendInvite(req.user, workspaceInviteSchema.parse(req.body))
    return apiResponse(res, result.status, result.message, result.data);
});

export const acceptInvite = asyncHandler(async (req, res) => {
    const result = await workspaceInvitesService.acceptInvite(req.user.id, req.user.email, acceptInviteSchema.parse(req.body));
    return apiResponse(res, result.status, result.message, result.data);
});

export const getInvites = asyncHandler(async (req, res) => {
    // const result = 
})