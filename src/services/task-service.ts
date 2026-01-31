import { config } from "@/config/env";
import { Project } from "@/models/project-model";
import { Task } from "@/models/task-model";
import { WorkspaceMember } from "@/models/workspace-member";
import { AssignTaskInput, CreateTaskInput, ToggleTaskStatusInput, UpdateTaskInput } from "@/schemas/task";
import { TaskContext, TaskStatus } from "@/types/task";
import { ApiError } from "@/utils/api-error";
import { canAssignTasks, canDeleteTask, canEditTaskContent, canUpdateTaskStatus } from "@/utils/permissions";
import slugify from "slugify";

class TaskService {

    async createTask(ctx: TaskContext, data: CreateTaskInput) {
        if (!ctx.isProjectMember) {
            throw new ApiError(403, 'Forbidden: You are not a member of this project');
        }

        const slug = slugify(data.title, { lower: true });
        const existingTask = await Task.exists({ slug, projectId: ctx.projectId, workspaceId: ctx.workspaceId })

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
        }).select('creator _id').lean().exec();

        if (!task) {
            throw new ApiError(404, 'Task no longer exists');
        }

        if (!canEditTaskContent(ctx.userRole, ctx.userId, task.creator.toString())) {
            throw new ApiError(403, 'Forbidden: You do not have permission to edit this task');
        }
        const updatedTask = await Task.findByIdAndUpdate(ctx.taskId, {
            $set: {
                ...data,
                lastModifiedAt: new Date(),
                lastModifiedBy: ctx.userId
            }
        }, { new: true, runValidators: true }).lean().exec();
        if (!updatedTask) {
            throw new ApiError(500, 'Failed to update task');
        }

        return {
            status: 200,
            message: 'Task updated successfully',
            data: updatedTask
        }
    }
    async deleteTask(ctx: TaskContext) {
        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId,
        })
            .select('creator subtasks assignee title')
            .lean()
            .exec();

        if (!task) {
            throw new ApiError(404, 'Task no longer exists');
        };

        if (!canDeleteTask(ctx.userRole, ctx.userId, task.creator)) {
            throw new ApiError(403, 'Forbidden: Insufficient permissions');
        }


        if (task.subtasks && task.subtasks.length > 0) {
            throw new ApiError(400, 'Cannot delete task with existing subtasks');
        }

        if (task.assignee) {
            throw new ApiError(400, 'Cannot delete task assigned to other users');
        }

        const result = await Task.deleteOne({ _id: ctx.taskId });

        if (result.deletedCount === 0) {
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
        }).populate({ path: 'creator', select: '_id username fullName email profilePhoto' }).populate({ path: 'assignee', select: '_id username fullName profilePhoto' }).lean().exec();

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

        const findQuery: any = {
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        };

        if (query.status) {
            findQuery.status = query.status;
        }

        // assignees is an array of ObjectIds
        if (ctx.userRole !== 'owner') {
            findQuery.$or = [
                { creator: ctx.userId },
                {
                    assignee: ctx.userId
                }
            ];
        }

        if (query.search) {
            const queryFilters = {
                $or: [
                    { title: { $regex: query.search, $options: 'i' } },
                    { description: { $regex: query.search, $options: 'i' } }
                ]
            };

            if (findQuery.$or) {
                findQuery.$and = [{ $or: findQuery.$or },
                    queryFilters
                ];
                delete findQuery.$or;
            } else {
                findQuery.$or = queryFilters.$or;
            }
        };



        // if owner in workspace => see all tasks across workspace
        // if admin => see tasks created by or assigned to him
        // if member => see tasks created by or assigned to him


        const [tasks, total] = await Promise.all([Task.find(findQuery).populate({ path: 'creator', select: '_id username fullName email profilePhoto' }).skip(skip).limit(limit).lean().exec()
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

    async toggleTaskStatus(ctx: TaskContext, { status, actualTime }: ToggleTaskStatusInput) {
        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        }).select('creator assignee').lean().exec();

        if (!task) {
            throw new ApiError(404, 'Task not found or no longer exists');
        }

        if (!canUpdateTaskStatus(ctx.userRole, ctx.userId, task.creator, task.assignee)) {
            throw new ApiError(403, 'Forbidden: You do not have permission to update the task status');
        }

        const update: any = {
            $set: {
                status,
                lastModifiedAt: new Date(),
                lastModifiedBy: ctx.userId,
            }
        };

        if (status === TaskStatus.DONE) {
            update.$set.completedAt = new Date();
            update.$set.completedBy = ctx.userId;
            if (actualTime) {
                update.$set.actualTime = actualTime;
            }
        } else {
            update.$unset = {
                completedAt: null,
                completedBy: null,
                actualTime: null
            };
        }
        const updatedTask = await Task.findOneAndUpdate({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        },
            update, { new: true }
        ).lean().exec();

        if (!updatedTask) {
            throw new ApiError(500, 'Failed to update task status');
        }
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

        console.log(ctx)
        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        });

        console.log(task)
        if (!task) {
            throw new ApiError(404, 'Task no longer exists');
        }

        if (task.assignee) {
            throw new ApiError(400, 'Task is already assigned');
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
                throw new ApiError(403, `Admins cannot assign tasks to themselves`);
            }
        }

        const updatedTask = await Task.findByIdAndUpdate(ctx.taskId, {
            $set: {
                assignee: assigneeId,
                isPrivate: false,
                lastModifiedAt: new Date(),
                lastModifiedBy: ctx.userId
            }
        }, { new: true, runValidators: true }).lean().exec();

        if (!updatedTask) {
            throw new ApiError(500, 'Failed to assign task. Please try again later');
        }

        return {
            status: 200,
            message: 'Task assigned successfully',
            data: updatedTask
        }
    }

    async unassignTask(ctx: TaskContext) {
        if (!canAssignTasks(ctx.userRole)) {
            throw new ApiError(403, 'Forbidden: You do not have permission to unassign tasks');
        }

        const task = await Task.findOne({
            _id: ctx.taskId,
            projectId: ctx.projectId,
            workspaceId: ctx.workspaceId
        }).select('assignee').lean().exec();

        if (!task) {
            throw new ApiError(404, 'Task no longer exists');
        }

        if (!task.assignee) {
            throw new ApiError(400, 'No assignee to unassign from this task');
        }

        const updatedTask = await Task.findOneAndUpdate({
            _id: ctx.taskId,
        }
            , {
                $set: {
                    assignee: null,
                    isPrivate: true,
                    lastModifiedAt: new Date(),
                    lastModifiedBy: ctx.userId
                }
            },
            { new: true, runValidators: true }).lean().exec()

        if (!updatedTask) {
            throw new ApiError(404, 'Task not found, no assignee to unassign, or no longer exists');
        }

        return {
            status: 200,
            message: 'Task unassigned successfully',
            data: updatedTask
        }
    }
}

export const taskService = new TaskService();