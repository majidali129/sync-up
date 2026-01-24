import { config } from "@/config/env";
import { Project } from "@/models/project-model";
import { WorkspaceMember } from "@/models/workspace-member";
import { AddMemberToProjectInput, CreateProjectInput, UpdateProjectInput, UpdateProjectStatusInput } from "@/schemas/project";
import { ApiError } from "@/utils/api-error";
import { ProjectContext } from "@/types/project";
import { Workspace } from "@/models/workspace-model";
import slugify from "slugify";
import { canManageProject, canViewProject } from "@/utils/permissions";
import { WorkspaceAuditLog } from "@/models/workspace-audit-log";
import { ObjectId } from "mongoose";
import { Task } from "@/models/task-model";


class ProjectService {
    async createProject(ctx: ProjectContext, data: CreateProjectInput) {
        if (!ctx.workspaceId) {
            throw new ApiError(400, 'Workspace ID is required to create a project');
        };
        if (ctx.userRole !== 'owner' && ctx.userRole !== 'admin') {
            throw new ApiError(403, 'Forbidden: Only workspace owners and admins can create projects');
        }
        const membersByDefault = [ctx.userId];

        if (ctx.userRole === 'admin') {

            const workspaceOwner = await Workspace.findById(ctx.workspaceId).select('ownerId').lean().exec();
            membersByDefault.push(workspaceOwner?.ownerId.toString());
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

        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'project',
            resourceId: project._id,
            action: 'created',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Project titled "${project.name}" was created`
        })

        return {
            status: 201,
            message: 'Project created successfully',
            data: project
        }
    }
    async updateProject(ctx: ProjectContext, data: UpdateProjectInput) {
        if (!ctx.isProjectMember) {
            throw new ApiError(403, 'Forbidden: Only project members can update project details');
        }

        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).exec();
        if (!project) {
            throw new ApiError(404, 'Project not found');
        };

        if (!canManageProject(ctx.userId, ctx.userRole, project.createdBy.toString())) {
            throw new ApiError(403, 'Not authorized to update this project');
        }

        Object.assign(project, {
            ...data,
            lastModifiedAt: new Date(),
            lastModifiedBy: ctx.userId
        });
        const updatedProject = await project.save({ validateBeforeSave: true });
        if (!updatedProject) {
            throw new ApiError(500, 'Failed to update project. Please try again later');
        }

        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'project',
            resourceId: project._id,
            action: 'updated',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Project details updated`
        })

        return {
            status: 200,
            message: 'Project updated successfully',
            data: updatedProject
        }
    }
    async deleteProject(ctx: ProjectContext) {
        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).exec();

        if (!project) {
            throw new ApiError(404, 'Project not found');
        }

        if (!canManageProject(ctx.userId, ctx.userRole, project.createdBy.toString())) {
            throw new ApiError(403, 'Not authorized to delete');
        }

        const linkedTasks = await Task.findOne({ projectId: project._id }).lean().exec();
        if (linkedTasks) {
            throw new ApiError(400, 'Cannot delete project with existing tasks. Please delete all tasks associated with this project first.');
        }

        const deletedProject = await Project.deleteOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).exec();

        if (deletedProject.deletedCount === 0) {
            throw new ApiError(500, 'Failed to delete project. Please try again later');
        }
        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'project',
            resourceId: project._id,
            action: 'deleted',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Project titled "${project.name}" was deleted`
        })
        return {
            status: 200,
            message: 'Project deleted successfully',
            data: null
        }
    }
    async getProjectDetails(ctx: ProjectContext) {
        if (!ctx.isProjectMember) {
            throw new ApiError(403, 'Forbidden: Only project members can view project details');
        }

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
            findQuery.name = { $regex: query.search, $options: 'i' };
            findQuery.description = { $regex: query.search, $options: 'i' };
        }

        //! if user is owner then he can see all projects
        //! if user is admin or member then he can see only projects where he is a member of others or his created projects
        if (ctx.userRole === 'admin' || ctx.userRole === 'member') {
            findQuery.$or = [
                {
                    visibility: 'public'
                },
                { createdBy: ctx.userId },
                {
                    members: {
                        $in: [ctx.userId]
                    }
                }
            ]
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
    async updateProjectStatus(ctx: ProjectContext, status: UpdateProjectStatusInput['status']) {
        if (!ctx.isProjectMember) {
            throw new ApiError(403, 'Forbidden: Only project members can update project status');
        }
        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }, { status }, { new: true }).exec();

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

        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'project',
            resourceId: project._id,
            action: 'updated',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Project status updated to ${status}`
        })


        return {
            status: 200,
            message: `Project status updated to ${status}`,
            data: updatedProject
        }
    }

    async addProjectMember(ctx: ProjectContext, targetUser: AddMemberToProjectInput) {

        const member = await WorkspaceMember.findOne({ userId: targetUser.memberId, workspaceId: ctx.workspaceId }).lean().exec();
        if (!member) {
            throw new ApiError(400, 'The user you are trying to add is not a member of this workspace');
        }

        if (targetUser.memberId === ctx.userId) {
            throw new ApiError(400, 'You cannot add yourself as a member to the project');
        };

        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).select('members').exec();
        if (!project) {
            throw new ApiError(404, 'Project no longer exists');
        }

        if (!canManageProject(ctx.userId, ctx.userRole, project.createdBy.toString())) {
            throw new ApiError(403, 'Not authorized to add members to this project');
        }

        if (project.members.includes(targetUser.memberId)) {
            throw new ApiError(400, 'The user is already a member of this project');
        }

        project.members.push(targetUser.memberId);
        project.lastModifiedAt = new Date();
        project.lastModifiedBy = ctx.userId;
        const updatedProject = await project.save({ validateBeforeSave: false });
        if (!updatedProject) {
            throw new ApiError(500, 'Failed to add member to project. Please try again later');
        }

        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'project',
            resourceId: project._id,
            action: 'member_added',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Member with ID ${targetUser.memberId} was added to the project`
        })

        return {
            status: 200,
            message: 'Member added to project successfully',
            data: updatedProject
        }

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

        const newMembers = project.members.filter((memberId: ObjectId) => memberId.toString() !== targetUserId);

        if (newMembers.length === project.members.length) {
            throw new ApiError(400, 'The user is not a member of this project');
        }

        project.members = newMembers;
        project.lastModifiedAt = new Date();
        project.lastModifiedBy = ctx.userId;
        const updatedProject = await project.save({ validateBeforeSave: false });
        if (!updatedProject) {
            throw new ApiError(500, 'Failed to remove member from project. Please try again later');
        }

        //TODO: unassign all tasks assigned to this user in this project
        const linkedTasks = await Task.find({
            projectId: ctx.projectId,
            assignees: {
                $in: [targetUserId]
            }
        });

        for (const task of linkedTasks) {
            task.assignees = task.assignees?.filter((assigneeId: ObjectId) => assigneeId.toString() !== targetUserId);
            task.lastModifiedAt = new Date();
            task.lastModifiedBy = ctx.userId;
            await task.save({ validateBeforeSave: false });
        }

        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'project',
            resourceId: project._id,
            action: 'member_removed',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Member with ID ${targetUserId} was removed from the project`
        })

        return {
            status: 200,
            message: 'Member removed from project successfully',
            data: updatedProject
        }
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
            message: project.members.length === 0 ? 'No members found for this project' : 'Project members retrieved successfully',
            data: {
                projectId: project._id,
                members: project.members
            }
        }
    }
}

export const projectService = new ProjectService();
