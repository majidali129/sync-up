import { CreateWorkspaceInput, UpdateWorkspaceInput } from "@/schemas/workspace";
import { workspaceService } from "@/services/workspace-service";
import { WorkspaceContext } from "@/types/workspace";
import { apiResponse } from "@/utils/api-response";
import { asyncHandler } from "@/utils/async-handler";
import { Request } from "express";

const getCtx = (req: Request): WorkspaceContext => {
    return {
        userId: req.user.id,
        workspaceId: req.params.workspaceId as string,
    }
}


export const createWorkspace = asyncHandler(async (req, res) => {
    const result = await workspaceService.createWorkspace(getCtx(req), req.body as CreateWorkspaceInput);
    return apiResponse(res, result.status, result.message, result.data)
})
export const updateWorkspace = asyncHandler(async (req, res) => {
    const result = await workspaceService.updateWorkspace(getCtx(req), req.body as UpdateWorkspaceInput);
    return apiResponse(res, result.status, result.message, result.data)
})
export const deleteWorkspace = asyncHandler(async (req, res) => {
    const result = await workspaceService.deleteWorkspace(getCtx(req));
    return apiResponse(res, result.status, result.message, result.data)
})
export const getWorkspaceDetails = asyncHandler(async (req, res) => {
    const result = await workspaceService.getWorkspaceDetails(getCtx(req));
    return apiResponse(res, result.status, result.message, result.data)
})
export const getAllWorkspaces = asyncHandler(async (req, res) => {
    const result = await workspaceService.getAllWorkspaces(getCtx(req), req.query);
    return apiResponse(res, result.status, result.message, result.data)
})