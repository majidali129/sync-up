import { AssignTaskInput, CreateTaskInput, ToggleTaskStatusInput, UnassignTaskInput, UpdateTaskInput, updateTaskSchema } from "@/schemas/task";
import { taskService } from "@/services/task-service";
import { TaskContext } from "@/types/task";
import { apiResponse } from "@/utils/api-response";
import { asyncHandler } from "@/utils/async-handler";
import { Request } from "express";

const getCtx = (req: Request): TaskContext => {
    return {
        userId: req.user.id,
        userRole: req.user.workspaceMember!.role,
        projectId: req.params.projectId as string,
        workspaceId: req.params.workspaceId as string,
        taskId: req.params.id as string,
        isProjectMember: req.isProjectMember || false
    }
}

export const createTask = asyncHandler(async (req, res) => {
    const result = await taskService.createTask(getCtx(req), req.body as CreateTaskInput)
    return apiResponse(res, result.status, result.message, result.data);
});
export const updateTask = asyncHandler(async (req, res) => {
    const result = await taskService.updateTask(getCtx(req), req.body as UpdateTaskInput)
    return apiResponse(res, result.status, result.message, result.data);
});
export const deleteTask = asyncHandler(async (req, res) => {
    const result = await taskService.deleteTask(getCtx(req));
    return apiResponse(res, result.status, result.message);
});
export const getTaskDetails = asyncHandler(async (req, res) => {
    const result = await taskService.getTaskDetails(getCtx(req));
    return apiResponse(res, result.status, result.message, result.data);
});
export const getTasks = asyncHandler(async (req, res) => {
    const result = await taskService.getTasks(getCtx(req), req.query);
    return apiResponse(res, result.status, result.message, result.data);
});
export const toggleTaskStatus = asyncHandler(async (req, res) => {
    const result = await taskService.toggleTaskStatus(getCtx(req), req.body as ToggleTaskStatusInput
    );
    return apiResponse(res, result.status, result.message, result.data);
});
export const assignTask = asyncHandler(async (req, res) => {
    const result = await taskService.assignTask(getCtx(req), req.body as AssignTaskInput);
    return apiResponse(res, result.status, result.message, result.data);
});
export const unassignTask = asyncHandler(async (req, res) => {
    const result = await taskService.unassignTask(getCtx(req));
    return apiResponse(res, result.status, result.message, result.data);
});
