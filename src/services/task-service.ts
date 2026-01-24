import { config } from "@/config/env";
import { Project } from "@/models/project-model";
import { Task } from "@/models/task-model";
import { WorkspaceAuditLog } from "@/models/workspace-audit-log";
import { WorkspaceMember } from "@/models/workspace-member";
import { AssignTaskInput, CreateTaskInput, ToggleTaskStatusInput, UpdateTaskInput } from "@/schemas/task";
import { TaskContext, TaskStatus } from "@/types/task";
import { ApiError } from "@/utils/api-error";
import { canAssignTasks, canDeleteTask, canEditTaskContent, canUpdateTaskStatus } from "@/utils/permissions";
import { ObjectId } from "mongoose";
import slugify from "slugify";

class TaskService {

    async createTask(ctx: TaskContext, data: CreateTaskInput) {
        if (!ctx.isProjectMember) {
            throw new ApiError(403, 'Forbidden: You are not a member of this project');
        }

        const slug = slugify(data.title, { lower: true });
        const existingTask = await Task.findOne({ slug, projectId: ctx.projectId, workspaceId: ctx.workspaceId }).lean().exec();

        if (existingTask) {
            throw new ApiError(400, 'A task with the same title already exists in this project. Please choose a different title.');
        }

        const newTask = await Task.create({
            ...data,
            slug,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId,
            creator: ctx.userId
        });

        if (!newTask) {
            throw new ApiError(500, 'Failed to create task');
        };


        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'task',
            resourceId: newTask._id,
            action: 'created',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Task titled "${newTask.title}" was created`
        })



        return {
            status: 201,
            message: 'Task created successfully',
            data: newTask
        }
    }
    async updateTask(ctx: TaskContext, data: UpdateTaskInput) {
        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        });

        if (!task) {
            throw new ApiError(404, 'Task no longer exists');
        }

        if (!canEditTaskContent(ctx.userRole, ctx.userId, task.creator.toString())) {
            throw new ApiError(403, 'Forbidden: You do not have permission to edit this task');
        }

        Object.assign(task, data);
        task.lastModifiedAt = new Date();
        task.lastModifiedBy = ctx.userId;

        const updatedTask = await task.save();
        if (!updatedTask) {
            throw new ApiError(500, 'Failed to update task');
        }

        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'task',
            resourceId: updatedTask._id,
            action: 'updated',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Task titled "${updatedTask.title}" details updated`
        })

        return {
            status: 200,
            message: 'Task updated successfully',
            data: updatedTask
        }
    }
    async deleteTask(ctx: TaskContext) {
        //TODO: Don't delete if subtasks exist OR assigned to someone else
        // only add creator check if role is member
        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId,
        });

        if (!task) {
            throw new ApiError(404, 'Task no longer exists');
        };

        if (!canDeleteTask(ctx.userRole, ctx.userId, task.creator.toString(), task.assignee)) {
            throw new ApiError(403, 'Forbidden: You do not have permission to delete this task');
        }


        if (task.subtasks && task.subtasks.length > 0) {
            throw new ApiError(400, 'Cannot delete task with existing subtasks');
        }

        if (task.assignee) {
            throw new ApiError(400, 'Cannot delete task assigned to a user');
        }

        const result = await task.deleteOne();
        if (result.deletedCount === 0 || !result.acknowledged) {
            throw new ApiError(500, 'Failed to delete task');
        }

        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'task',
            resourceId: task._id,
            action: 'deleted',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Task titled "${task.title}" was deleted`
        })

        return {
            status: 200,
            message: 'Task deleted successfully',
            data: null
        }

    }
    async getTaskDetails(ctx: TaskContext) {
        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        }).populate({ path: 'creator', select: '_id username fullName email profilePhoto' }).populate({ path: 'assignee', select: '_id username fullName email profilePhoto' }).lean().exec();

        if (!task) {
            throw new ApiError(404, 'Task not found');
        }
        return {
            status: 200,
            message: 'Task retrieved successfully',
            data: task
        }
    }

    async getTasks(ctx: TaskContext, query: { limit?: string, page?: string, status?: string, search?: string }) {
        const limit = query.limit ? parseInt(query.limit, 10) : +config.DEFAULT_RESPONSE_LIMIT;
        const page = query.page ? parseInt(query.page, 10) : 1;
        const skip = (page - 1) * limit;



        const findQuery: any = { projectId: ctx.projectId, workspaceId: ctx.workspaceId };
        if (query.status) {
            findQuery.status = query.status;
        }
        if (query.search) {
            findQuery.title = { $regex: query.search, $options: 'i' };
            findQuery.description = { $regex: query.search, $options: 'i' };
        }

        // if owner in workspace => see all tasks across workspace
        // if admin => see tasks created by or assigned to him
        // if member => see tasks created by or assigned to him

        if (ctx.userRole !== 'owner') {
            findQuery.$or = [{ creator: ctx.userId }, { assignee: ctx.userId }];
        }
        const [tasks, total] = await Promise.all([Task.find(findQuery).populate({ path: 'creator', select: '_id username fullName email profilePhoto' }).skip(skip).limit(limit)
            ,
        Task.countDocuments(findQuery)]);

        return {
            status: 200,
            message: 'Tasks retrieved successfully',
            data: {
                total, page, limit,
                tasks,
            }
        }
    }
    async toggleTaskStatus(ctx: TaskContext, { status }: ToggleTaskStatusInput) {
        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        });
        if (!task) {
            throw new ApiError(404, 'Task not found or no longer exists');
        }



        if (!canUpdateTaskStatus(ctx.userRole, ctx.userId, task.creator.toString(), task.assignees.map((a: ObjectId) => a.toString()))) {
            throw new ApiError(403, 'Forbidden: You do not have permission to update the task status');
        }

        task.status = status;
        task.lastModifiedAt = new Date();
        task.lastModifiedBy = ctx.userId;
        if (status === TaskStatus.DONE) {
            task.completedAt = new Date();
            task.completedBy = ctx.userId;
        }

        const updatedTask = await task.save();
        if (!updatedTask) {
            throw new ApiError(500, 'Failed to update task status');
        }

        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'task',
            resourceId: updatedTask._id,
            action: 'updated',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Status changed to ${status}`
        })

        return {
            status: 200,
            message: 'Task status updated successfully',
            data: updatedTask
        }
    }
    async assignTask(ctx: TaskContext, { assigneeId }: AssignTaskInput) {

        if (!canAssignTasks(ctx.userRole)) {
            throw new ApiError(403, 'Forbidden: You do not have permission to assign tasks');
        }

        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        });

        if (!task) {
            throw new ApiError(404, 'Task no longer exists');
        }

        if (task.assignees.map((a: ObjectId) => a.toString()).includes(assigneeId)) {
            throw new ApiError(400, 'Task is already assigned to this user');
        }

        const [workspaceMember, projectMember] = await Promise.all([
            WorkspaceMember.findOne({ userId: assigneeId, workspaceId: ctx.workspaceId }).lean(),
            Project.findOne({
                _id: ctx.projectId, members: {
                    $in: [assigneeId]
                }
            }).lean()
        ]);

        if (!workspaceMember) throw new ApiError(404, 'Assignee is not a member of this workspace');
        if (!projectMember) throw new ApiError(403, 'Assignee is not a member of this project');

        const targetRole = workspaceMember.role; // person being assigned the task
        const assignerRole = ctx.userRole; // person assigning the task


        if (assignerRole === 'admin') {
            if (targetRole === 'owner') {
                throw new ApiError(403, `Admins cannot assign tasks to owners`);
            }
            if (assigneeId === ctx.userId) {
                throw new ApiError(403, `You cannot assign tasks to themselves`);
            }
        }

        task.assignees.push(assigneeId);
        task.isPersonal = false;

        const updatedTask = await task.save();

        if (!updatedTask) {
            throw new ApiError(500, 'Failed to assign task. Please try again later');
        }


        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'task',
            resourceId: updatedTask._id,
            action: 'assigned',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Task assigned to user with ID ${assigneeId}`
        })

        return {
            status: 200,
            message: 'Task assigned successfully',
            data: updatedTask
        }
    }
    async unassignTask(ctx: TaskContext, { assigneeId }: AssignTaskInput) {
        if (!canAssignTasks(ctx.userRole)) {
            throw new ApiError(403, 'Forbidden: You do not have permission to unassign tasks');
        }

        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        });

        if (!task) {
            throw new ApiError(404, 'Task no longer exists');
        }

        if (task.assignees.length === 0) {
            throw new ApiError(400, 'No assignee to unassign from this task');
        }

        task.assignees = task.assignees.filter((id: ObjectId) => id.toString() !== assigneeId);
        if (task.assignees.length === 0) {
            task.isPersonal = true;
        }

        const updatedTask = await task.save();

        if (!updatedTask) {
            throw new ApiError(404, 'Task not found, no assignee to unassign, or no longer exists');
        }

        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'task',
            resourceId: updatedTask._id,
            action: 'unassigned',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Task unassigned from user with ID ${assigneeId}`
        })

        return {
            status: 200,
            message: 'Task unassigned successfully',
            data: updatedTask
        }
    }
}

export const taskService = new TaskService();