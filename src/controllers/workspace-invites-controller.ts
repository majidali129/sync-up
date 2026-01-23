import { acceptInviteSchema, workspaceInviteSchema } from "@/schemas/workspace-invite";
import { workspaceInvitesService } from "@/services/workspace-invites-service";
import { WorkspaceInviteContext } from "@/types/workspace";
import { apiResponse } from "@/utils/api-response";
import { asyncHandler } from "@/utils/async-handler";
import { Request } from "express";

const getCtx = (req: Request): WorkspaceInviteContext => ({
    userId: req.user.id,
    username: req.user.username,
    fullName: req.user.fullName,
    email: req.user.email,
    workspaceId: req.params?.workspaceId as string,
})

export const sendInvite = asyncHandler(async (req, res) => {
    const result = await workspaceInvitesService.sendInvite(getCtx(req), workspaceInviteSchema.parse(req.body))
    return apiResponse(res, result.status, result.message, result.data);
});

export const acceptInvite = asyncHandler(async (req, res) => {
    const result = await workspaceInvitesService.acceptInvite(getCtx(req), acceptInviteSchema.parse(req.body));
    return apiResponse(res, result.status, result.message, result.data);
});

export const getWorkspaceInvites = asyncHandler(async (req, res) => {
    const result = await workspaceInvitesService.getWorkspaceInvites(getCtx(req), req.query);
    return apiResponse(res, result.status, result.message, result.data);
});


export const getGlobalInvites = asyncHandler(async (req, res) => {
    const result = await workspaceInvitesService.getGlobalInvites(getCtx(req));
    return apiResponse(res, result.status, result.message, result.data);
})