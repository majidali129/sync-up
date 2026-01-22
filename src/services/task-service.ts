import { config } from "@/config/env";
import { Project } from "@/models/project-model";
import { Task } from "@/models/task-model";
import { WorkspaceMember } from "@/models/workspace-member";
import { AssignTaskInput, CreateTaskInput, ToggleTaskStatusInput, UpdateTaskInput } from "@/schemas/task";
import { TaskContext, TaskStatus } from "@/types/task";
import { ApiError } from "@/utils/api-error";
import { isOwnerAdmin } from "@/utils/is-owner-admin";
import slugify from "slugify";

class TaskService {

    async createTask(ctx: TaskContext, data: CreateTaskInput) {
        const query: any = {
            _id: ctx.projectId,
            workspaceId: ctx.workspaceId
        };
        // check for project membership except owner.
        if (ctx.userRole !== 'owner') {
            query.members = {
                $in: [ctx.userId]
            };
        }

        const isMember = await Project.findOne(query).lean().exec();

        if (!isMember) {
            throw new ApiError(403, 'Forbidden: You are not a member of this project');
        };
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

        // if (ctx.userRole === 'member' && task.creator.toString() !== ctx.userId && task.assignee?.toString() !== ctx.userId) {
        if (this.isMemberAuthor(ctx, task)) {
            throw new ApiError(403, 'Forbidden: You must be the creator or assignee to update this task');
        }

        Object.assign(task, data);

        const updatedTask = await task.save();

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

        if (this.isMemberAuthor(ctx, task) && !task) {
            throw new ApiError(403, 'Forbidden: You must be the creator or assignee to delete this task');
        };



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

    async getTasks(ctx: TaskContext, query: { limit?: string, page?: string, status?: string }) {
        const limit = query.limit ? parseInt(query.limit, 10) : +config.DEFAULT_RESPONSE_LIMIT;
        const page = query.page ? parseInt(query.page, 10) : 1;
        const skip = (page - 1) * limit;

        const findQuery: any = { projectId: ctx.projectId, workspaceId: ctx.workspaceId };
        if (query.status) {
            findQuery.status = query.status;
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
        if (ctx.userRole === 'viewer') {
            throw new ApiError(403, 'Viewers are not allowed to change task status');
        }
        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        });
        if (!task) {
            throw new ApiError(404, 'Task not found or no longer exists');
        }

        if (this.isMemberAuthor(ctx, task)) {
            throw new ApiError(403, 'Forbidden: You must be the creator or assignee to update this task');
        };

        task.status = status;

        const updatedTask = await task.save();

        return {
            status: 200,
            message: 'Task status updated successfully',
            data: updatedTask
        }
    }
    async assignTask(ctx: TaskContext, { assigneeId }: AssignTaskInput) {
        if (!isOwnerAdmin(ctx.userRole)) {
            throw new ApiError(403, 'Forbidden: Only owners and admins can assign tasks');
        };

        const [workspaceMember, project] = await Promise.all([
            WorkspaceMember.findOne({ userId: assigneeId, workspaceId: ctx.workspaceId }).lean(),
            Project.findOne({
                _id: ctx.projectId, members: {
                    $in: [assigneeId]
                }
            }).lean()
        ]);

        if (!workspaceMember) throw new ApiError(404, 'Assignee is not a member of this workspace');
        if (!project) throw new ApiError(403, 'Assignee is not a member of this project');

        const targetRole = workspaceMember.role; // person being assigned the task
        const assignerRole = ctx.userRole; // person assigning the task


        if (assignerRole === 'admin') {
            if (targetRole === 'owner' || targetRole === 'admin') {
                throw new ApiError(403, `Admins cannot assign tasks to ${targetRole}s`);
            }
        }

        const updatedTask = await Task.findOneAndUpdate({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId,
            assignee: null,
            // status not archived or done
            status: {
                $nin: [TaskStatus.ARCHIVED, TaskStatus.DONE]
            }
        }, {
            $set: { assignee: assigneeId, isPersonal: false }
        }, { new: true });

        if (!updatedTask) {
            throw new ApiError(404, 'Task not found, already assigned, archived, completed, or no longer exists');
        }

        return {
            status: 200,
            message: 'Task assigned successfully',
            data: updatedTask
        }
    }
    async unassignTask(ctx: TaskContext) {
        if (!isOwnerAdmin(ctx.userRole)) {
            throw new ApiError(403, 'Forbidden: Only owners and admins can unassign tasks');
        };

        const updatedTask = await Task.findOneAndUpdate({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId,
            assignee: { $ne: null }
        }, {
            $set: { assignee: null, isPersonal: true }
        }, { new: true });

        if (!updatedTask) {
            throw new ApiError(404, 'Task not found, no assignee to unassign, or no longer exists');
        }

        return {
            status: 200,
            message: 'Task unassigned successfully',
            data: updatedTask
        }
    }

    private isMemberAuthor(ctx: TaskContext, task: any) {
        return ctx.userRole === 'member' && task.creator.toString() !== ctx.userId && task.assignee?.toString() !== ctx.userId;
    }
}

export const taskService = new TaskService();