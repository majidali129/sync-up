import { addMemberToProjectSchema, createProjectSchema, updateProjectSchema, updateProjectStatusSchema } from "@/schemas/project";
import { projectService } from "@/services/project-service"
import { ProjectContext } from "@/types/project";
import { apiResponse } from "@/utils/api-response";
import { asyncHandler } from "@/utils/async-handler"



export const createProject = asyncHandler(async (req, res) => {
    const ctx: ProjectContext = {
        userId: req.user.id,
        userRole: req.user.role!,
        workspaceId: req.params.workspaceId as string,
    };
    const result = await projectService.createProject(ctx, createProjectSchema.parse(req.body))
    return apiResponse(res, result.status, result.message, result.data)
})
export const updateProject = asyncHandler(async (req, res) => {
    const ctx: ProjectContext = {
        userId: req.user.id,
        userRole: req.user.role!,
        workspaceId: req.params.workspaceId as string,
        projectId: req.params.id as string,
    };
    const result = await projectService.updateProject(ctx, updateProjectSchema.parse(req.body))
    return apiResponse(res, result.status, result.message, result.data)
})
export const deleteProject = asyncHandler(async (req, res) => {
    const ctx: ProjectContext = {
        userId: req.user.id,
        userRole: req.user.role!,
        workspaceId: req.params.workspaceId as string,
        projectId: req.params.id as string,
    };
    const result = await projectService.deleteProject(ctx)
    return apiResponse(res, result.status, result.message, result.data)
})
export const updateProjectStatus = asyncHandler(async (req, res) => {
    const ctx: ProjectContext = {
        userId: req.user.id,
        userRole: req.user.role!,
        workspaceId: req.params.workspaceId as string,
        projectId: req.params.id as string,
    };
    const result = await projectService.updateProjectStatus(ctx, updateProjectStatusSchema.parse(req.body).status);
    return apiResponse(res, result.status, result.message, result.data)
})

export const getProjectDetails = asyncHandler(async (req, res) => {
    const ctx: ProjectContext = {
        userId: req.user.id,
        userRole: req.user.role!,
        workspaceId: req.params.workspaceId as string,
        projectId: req.params.id as string,
    };
    const result = await projectService.getProjectDetails(ctx)
    return apiResponse(res, result.status, result.message, result.data)
})
export const getProjects = asyncHandler(async (req, res) => {
    const ctx: ProjectContext = {
        userId: req.user.id,
        userRole: req.user.role!,
        workspaceId: req.params.workspaceId as string,
    };
    const result = await projectService.getProjects(ctx, req.query)
    return apiResponse(res, result.status, result.message, result.data)
})


export const addProjectMember = asyncHandler(async (req, res) => {

    const ctx: ProjectContext = {
        userId: req.user.id,
        userRole: req.user.role!,
        workspaceId: req.params.workspaceId as string,
        projectId: req.params.id as string,
    };
    const result = await projectService.addProjectMember(ctx, addMemberToProjectSchema.parse(req.body))
    return apiResponse(res, result.status, result.message, result.data)
})

export const removeProjectMember = asyncHandler(async (req, res) => {
    const ctx: ProjectContext = {
        userId: req.user.id,
        userRole: req.user.role!,
        workspaceId: req.params.workspaceId as string,
        projectId: req.params.id as string,
    };
    const result = await projectService.removeProjectMember(ctx, req.params.memberId as string);
    return apiResponse(res, result.status, result.message, result.data)
});

export const getProjectMembers = asyncHandler(async (req, res) => {
    const ctx: ProjectContext = {
        userId: req.user.id,
        userRole: req.user.role!,
        workspaceId: req.params.workspaceId as string,
        projectId: req.params.id as string,
    };
    const result = await projectService.getProjectMembers(ctx)
    return apiResponse(res, result.status, result.message, result.data)
})