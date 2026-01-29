import { AddMemberToProjectInput, CreateProjectInput, UpdateProjectInput, UpdateProjectStatusInput } from "@/schemas/project";
import { projectService } from "@/services/project-service"
import { ProjectContext } from "@/types/project";
import { apiResponse } from "@/utils/api-response";
import { asyncHandler } from "@/utils/async-handler"
import { Request } from "express";


const getCtx = (req: Request): ProjectContext => {
    return {
        userId: req.user.id,
        userRole: req.user.workspaceMember!.role,
        workspaceId: req.params.workspaceId as string,
        projectId: req.params.projectId as string,
        isProjectMember: req.isProjectMember || false
    }
}


export const createProject = asyncHandler(async (req, res) => {

    const result = await projectService.createProject(getCtx(req), req.body as CreateProjectInput)
    return apiResponse(res, result.status, result.message, result.data)
})
export const updateProject = asyncHandler(async (req, res) => {
    const result = await projectService.updateProject(getCtx(req), req.body as UpdateProjectInput)
    return apiResponse(res, result.status, result.message, result.data)
})
export const deleteProject = asyncHandler(async (req, res) => {
    const result = await projectService.deleteProject(getCtx(req));
    return apiResponse(res, result.status, result.message, result.data)
})

export const updateProjectStatus = asyncHandler(async (req, res) => {
    const result = await projectService.updateProjectStatus(getCtx(req), req.body as UpdateProjectStatusInput);
    return apiResponse(res, result.status, result.message, result.data)
})

export const getProjectDetails = asyncHandler(async (req, res) => {
    const result = await projectService.getProjectDetails(getCtx(req))
    return apiResponse(res, result.status, result.message, result.data)
})
export const getProjects = asyncHandler(async (req, res) => {
    const result = await projectService.getProjects(getCtx(req), req.query)
    return apiResponse(res, result.status, result.message, result.data)
})


export const addProjectMember = asyncHandler(async (req, res) => {
    const result = await projectService.addProjectMember(getCtx(req), req.body as AddMemberToProjectInput)
    return apiResponse(res, result.status, result.message, result.data)
})

export const removeProjectMember = asyncHandler(async (req, res) => {
    const result = await projectService.removeProjectMember(getCtx(req), req.params.memberId as string);
    return apiResponse(res, result.status, result.message, result.data)
});

export const getProjectMembers = asyncHandler(async (req, res) => {
    const result = await projectService.getProjectMembers(getCtx(req))
    return apiResponse(res, result.status, result.message, result.data)
})