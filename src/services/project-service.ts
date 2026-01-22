import { config } from "@/config/env";
import { Project } from "@/models/project-model";
import { WorkspaceMember } from "@/models/workspace-member";
import { AddMemberToProjectInput, CreateProjectInput, UpdateProjectInput, UpdateProjectStatusInput } from "@/schemas/project";
import { ApiError } from "@/utils/api-error";
import { ProjectContext } from "@/types/project";


class ProjectService {
    async createProject(ctx: ProjectContext, data: CreateProjectInput) {
        if (!ctx.workspaceId) {
            throw new ApiError(400, 'Workspace ID is required to create a project');
        };

        const project = await Project.create({
            ...data,
            createdBy: ctx.userId,
            workspaceId: ctx.workspaceId
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
        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).exec();
        if (!project) {
            throw new ApiError(404, 'Project not found or not authorized to update');
        };

        Object.assign(project, data);
        const updatedProject = await project.save({ validateBeforeSave: true });

        return {
            status: 200,
            message: 'Project updated successfully',
            data: updatedProject
        }
    }
    async deleteProject(ctx: ProjectContext) {

        // TODO: also delete all tasks associated with this project using transaction
        const deletedProject = await Project.findOneAndDelete({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).exec();

        if (!deletedProject) {
            throw new ApiError(404, 'Project not found or not authorized');
        }

        return {
            status: 200,
            message: 'Project deleted successfully',
            data: deletedProject
        }
    }
    async getProjectDetails(ctx: ProjectContext) {
        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).populate({
            path: 'createdBy',
            select: 'username email profilePhoto _id'
        }).lean().exec();

        if (!project) {
            throw new ApiError(404, 'Project not found or not authorized');
        }
        return {
            status: 200,
            message: 'Project details retrieved successfully',
            data: project
        }
    }
    async getProjects(ctx: ProjectContext, query: { limit?: string, page?: string }) {
        const limit = query.limit ? parseInt(query.limit, 10) : +config.DEFAULT_RESPONSE_LIMIT;
        const page = query.page ? parseInt(query.page, 10) : 1;
        const skip = (page - 1) * limit;
        const [projects, total] = await Promise.all([Project.find({ workspaceId: ctx.workspaceId }).populate({
            path: 'createdBy',
            select: 'username fullName email profilePhoto _id'
        }).select('_id name icon color status visibility createdAt').limit(limit).skip(skip).lean().exec(),
        Project.countDocuments({ workspaceId: ctx.workspaceId }).exec()
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
        const updatedProject = await Project.findOneAndUpdate({ _id: ctx.projectId, workspaceId: ctx.workspaceId }, { status }, { new: true }).exec();

        if (!updatedProject) {
            throw new ApiError(404, 'Project not found or not authorized');
        }


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

        if (ctx.userRole === 'admin' && member.role === 'admin') {
            throw new ApiError(403, 'Admins cannot add other admins to the project. Please contact the workspace owner to perform this action');
        }

        const project = await Project.findOne({ _id: ctx.projectId, workspaceId: ctx.workspaceId }).select('members').exec();
        if (!project) {
            throw new ApiError(404, 'Project no longer exists or not authorized');
        }

        if (project.members.includes(targetUser.memberId)) {
            throw new ApiError(400, 'The user is already a member of this project');
        }

        project.members.push(targetUser.memberId);
        const updatedProject = await project.save({ validateBeforeSave: false });

        return {
            status: 200,
            message: 'Member added to project successfully',
            data: updatedProject
        }

    }
    async removeProjectMember(ctx: ProjectContext, targetUserId: string) {

        const updatedProject = await Project.findOneAndUpdate({ _id: ctx.projectId, workspaceId: ctx.workspaceId }, {
            $pull: { members: targetUserId }
        },
            { new: true }).lean().exec();

        if (!updatedProject) {
            throw new ApiError(404, 'Project not found or failed to remove member');
        };

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
