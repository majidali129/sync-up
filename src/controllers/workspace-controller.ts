import { createWorkspaceSchema, updateWorkspaceSchema } from "@/schemas/workspace";
import workspaceService from "@/services/workspace-service";
import { apiResponse } from "@/utils/api-response";
import { asyncHandler } from "@/utils/async-handler";



export const createWorkspace = asyncHandler(async (req, res) => {
    const result = await workspaceService.createWorkspace(req, createWorkspaceSchema.parse(req.body));
    return apiResponse(res, result.status, result.message, result.data)

})
export const updateWorkspace = asyncHandler(async (req, res) => {
    const workspaceId = req.params.id as string;
    const result = await workspaceService.updateWorkspace(req, workspaceId, updateWorkspaceSchema.parse(req.body));
    return apiResponse(res, result.status, result.message, result.data)
})
export const deleteWorkspace = asyncHandler(async (req, res) => {
    const workspaceId = req.params.id as string;
    const result = await workspaceService.deleteWorkspace(req, workspaceId);
    return apiResponse(res, result.status, result.message, result.data)
})
export const getWorkspaceDetails = asyncHandler(async (req, res) => {
    const workspaceId = req.params.id as string;
    const result = await workspaceService.getWorkspaceDetails(req, workspaceId);
    return apiResponse(res, result.status, result.message, result.data)
})
export const getAllWorkspaces = asyncHandler(async (req, res) => {
    const query = req.query;
    const result = await workspaceService.getAllWorkspaces(query);
    return apiResponse(res, result.status, result.message, result.data)
})