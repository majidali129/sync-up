import { acceptInviteSchema, workspaceInviteSchema } from "@/schemas/workspace-invite";
import { workspaceInvitesService } from "@/services/workspace-invites-service";
import { apiResponse } from "@/utils/api-response";
import { asyncHandler } from "@/utils/async-handler";

export const sendInvite = asyncHandler(async (req, res) => {
    const workspaceId = req.params?.workspaceId as string;
    const result = await workspaceInvitesService.sendInvite(req.user, workspaceId, workspaceInviteSchema.parse(req.body))
    return apiResponse(res, result.status, result.message, result.data);
});

export const acceptInvite = asyncHandler(async (req, res) => {
    const { id, email } = req.user;
    const result = await workspaceInvitesService.acceptInvite(id, email, acceptInviteSchema.parse(req.body));
    return apiResponse(res, result.status, result.message, result.data);
});

export const getWorkspaceInvites = asyncHandler(async (req, res) => {
    const workspaceId = req.params?.workspaceId as string;
    const userId = req.user.id;
    const result = await workspaceInvitesService.getWorkspaceInvites(workspaceId, userId, req.query);
    return apiResponse(res, result.status, result.message, result.data);
});


export const getGlobalInvites = asyncHandler(async (req, res) => {
    const result = await workspaceInvitesService.getGlobalInvites(req.user.email);
    return apiResponse(res, result.status, result.message, result.data);
})