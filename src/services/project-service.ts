import { config } from "@/config/env";
import { Project } from "@/models/project-model";
import { WorkspaceMember } from "@/models/workspace-member";
import { AddMemberToProjectInput, CreateProjectInput, UpdateProjectInput, UpdateProjectStatusInput } from "@/schemas/project";
import { ApiError } from "@/utils/api-error";
import { ProjectContext } from "@/types/project";
import { Workspace } from "@/models/workspace-model";
import slugify from "slugify";
import { canManageProject, canViewProject } from "@/utils/permissions";
import { Task } from "@/models/task-model";
import { withTransaction } from '@/utils/with-transaction'


class ProjectService {
    async createProject(ctx: ProjectContext, data: CreateProjectInput) {
        if (!ctx.workspaceId) {
            throw new ApiError(400, 'Workspace ID is required to create a project');
        };
        if (ctx.userRole !== 'owner' && ctx.userRole !== 'admin') {
            throw new ApiError(403, 'Forbidden: Only workspace owners and admins can create projects');
        }
        const membersByDefault = [ctx.userId];

        const workspace = await Workspace.findById(ctx.workspaceId).select('ownerId').lean().exec();
        if (!workspace) {
            throw new ApiError(404, 'Workspace no longer exists');
        }
        if (ctx.userId !== workspace.ownerId.toString()) {
            membersByDefault.push(workspace.ownerId.toString());
        }

        const project = await Project.create({
            ...data,
            slug: slugify(data.name, { lower: true, strict: true }),
            createdBy: ctx.userId,
            workspaceId: ctx.workspaceId,
            members: membersByDefault
        });

        if (!project) {
            throw new ApiError(500, 'Failed to create project. Please try again later');
        }

        return {
            status: 201,
            message: 'Project created successfully',
            data: project
        }
    }
    async updateProject(ctx: ProjectContext, data: UpdateProjectInput) {
        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).select('createdBy').exec();
        if (!project) {
            throw new ApiError(404, 'Project not found');
        };

        if (!canManageProject(ctx.userId, ctx.userRole, project.createdBy.toString())) {
            throw new ApiError(403, 'Not authorized to update this project');
        }

        const updatedProject = await Project.findByIdAndUpdate(project._id, {
            $set: {
                ...data,
                lastModifiedAt: new Date(),
                lastModifiedBy: ctx.userId
            }
        }, { new: true, runValidators: true }).lean().exec();
        if (!updatedProject) {
            throw new ApiError(500, 'Update failed');
        }
        return {
            status: 200,
            message: 'Project updated successfully',
            data: updatedProject
        }
    }

    async deleteProject(ctx: ProjectContext) {
        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).select('createdBy').lean().exec();
        if (!project) {
            throw new ApiError(404, 'Project not found');
        }
        if (!canManageProject(ctx.userId, ctx.userRole, project.createdBy.toString())) {
            throw new ApiError(403, 'Not authorized to delete');
        }
        return withTransaction(async (session) => {
            // 1. Deleted all tasks linked to this project;
            await Task.deleteMany({ projectId: ctx.projectId }, { session });
            // 2. Delete the project
            await Project.deleteOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }, { session })
            return {
                status: 200,
                message: 'Project deleted successfully',
                data: null
            }

        })
    }

    async getProjectDetails(ctx: ProjectContext) {
        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).populate({
            path: 'createdBy',
            select: 'username email profilePhoto _id'
        }).lean().exec();

        if (!project) {
            throw new ApiError(404, 'Project not found.');
        }

        if (!canViewProject(ctx.userRole, ctx.userId, project.visibility, project.createdBy.toString(), project.members)) {
            throw new ApiError(403, 'Not authorized to view this project');
        }

        // TODO: get tasks , their stats 
        /*
        stats: {
        totalTasks: number,
        completedTasks: number,
        inProgressTasks: number,
        overdueTasks: number,
    },
        */

        return {
            status: 200,
            message: 'Project details retrieved successfully',
            data: project
        }
    }
    async getProjects(ctx: ProjectContext, query: { limit?: string, page?: string, search?: string }) {
        const limit = query.limit ? parseInt(query.limit, 10) : +config.DEFAULT_RESPONSE_LIMIT;
        const page = query.page ? parseInt(query.page, 10) : 1;
        const skip = (page - 1) * limit;

        const findQuery: any = { workspaceId: ctx.workspaceId };
        if (query.search) {
            findQuery.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { description: { $regex: query.search, $options: 'i' } }
            ]
        }

        //! if user is owner then he can see all projects
        //! if user is admin or member then he can see only projects where he is a member of others or his created projects
        if (ctx.userRole === 'admin' || ctx.userRole === 'member') {
            const filtersPerRole = {
                $or: [
                    { visibility: 'public' },
                    { createdBy: ctx.userId },
                    { members: { $in: [ctx.userId] } }
                ]
            }

            if (findQuery.$or) {
                findQuery.$and = [{ $or: findQuery.$or }, filtersPerRole];
                delete findQuery.$or;
            } else {
                findQuery.$or = filtersPerRole.$or;
            }
        }
        const [projects, total] = await Promise.all([Project.find(findQuery).populate({
            path: 'createdBy',
            select: 'username fullName email profilePhoto _id'
        }).select('_id name icon color status visibility createdAt').limit(limit).skip(skip).lean().exec(),
        Project.countDocuments(findQuery).exec()
        ]);
        return {
            status: 200,
            message: 'Projects retrieved successfully',
            data: {
                limit,
                page,
                total,
                projects
            }
        }
    }
    async updateProjectStatus(ctx: ProjectContext, { status }: UpdateProjectStatusInput) {
        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).exec();

        if (!project) {
            throw new ApiError(404, 'Project not found');
        }

        if (!canManageProject(ctx.userId, ctx.userRole, project.createdBy.toString())) {
            throw new ApiError(403, 'Not authorized to update project status');
        }
        const updatedProject = await Project.findByIdAndUpdate(project._id, {
            status,
            lastModifiedAt: new Date(),
            lastModifiedBy: ctx.userId
        }, { new: true }).lean().exec();

        if (!updatedProject) {
            throw new ApiError(500, 'Failed to update project status. Please try again later');
        }

        return {
            status: 200,
            message: `Project status updated to ${status}`,
            data: updatedProject
        }
    }

    async addProjectMember(ctx: ProjectContext, targetUser: AddMemberToProjectInput) {
        const [isMember, project] = await Promise.all([
            WorkspaceMember.exists({ userId: targetUser.memberId, workspaceId: ctx.workspaceId }),
            Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).select('createdBy members name').lean()
        ]);

        if (!isMember) throw new ApiError(400, 'User not in workspace');
        if (!project) throw new ApiError(404, 'Project not found');
        if (!canManageProject(ctx.userId, ctx.userRole, project.createdBy.toString())) {
            throw new ApiError(403, 'Not authorized');
        }

        if (project.members.some(id => id.toString() === targetUser.memberId)) {
            throw new ApiError(400, 'User is already a member');
        }

        const updatedProject = await Project.findOneAndUpdate(
            { _id: ctx.projectId },
            {
                $addToSet: { members: targetUser.memberId }, // Atomic "Add if not exists"
                $set: {
                    lastModifiedAt: new Date(),
                    lastModifiedBy: ctx.userId
                }
            },
            { new: true, runValidators: false }
        );

        if (!updatedProject) throw new ApiError(500, 'Update failed');
        return {
            status: 200,
            message: 'Member added successfully',
            data: updatedProject
        };
    }
    async removeProjectMember(ctx: ProjectContext, targetUserId: string) {
        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).select('members createdBy').exec();

        if (!project) {
            throw new ApiError(404, 'Project not found');
        };


        if (!canManageProject(ctx.userId, ctx.userRole, project.createdBy.toString())) {
            throw new ApiError(403, 'Not authorized to remove members from this project');
        }

        if (targetUserId === project.createdBy.toString()) {
            throw new ApiError(400, 'Cannot remove project creator from project members');
        }

        if (!project.members.some(id => id.toString() === targetUserId)) {
            throw new ApiError(400, 'User is not a member of this project');
        }

        return withTransaction(async (session) => {

            const updatedProject = await Project.findOneAndUpdate({
                _id: ctx.projectId,
                workspaceId: ctx.workspaceId
            },
                {
                    $pull: { members: targetUserId },
                    $set: {
                        lastModifiedAt: new Date(),
                        lastModifiedBy: ctx.userId
                    }
                },
                { new: true, session }
            ).lean().exec();

            if (!updatedProject) throw new ApiError(500, 'Failed to update project');

            // unassign all tasks assigned to this user in this project

            await Task.updateMany({
                projectId: ctx.projectId,
                assignees: {
                    $in: [targetUserId]
                }
            }, {
                $pull: {
                    assignees: targetUserId
                },
                lastModifiedAt: new Date(),
                lastModifiedBy: ctx.userId
            }, { session });

            return {
                status: 200,
                message: 'Member removed successfully',
                data: updatedProject
            };
        })
    }

    async getProjectMembers(ctx: ProjectContext) {
        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).select('members _id').populate({
            path: 'members',
            select: 'username fullName email profilePhoto _id'
        }).lean().exec();

        if (!project) {
            throw new ApiError(404, 'Project not found');
        }

        return {
            status: 200,
            message: 'Project members retrieved successfully',
            data: {
                projectId: project._id,
                members: project.members
            }
        }
    }
}

export const projectService = new ProjectService();
