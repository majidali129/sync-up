import { Workspace } from "@/models/workspace-model";
import { UpdateWorkspaceInput, CreateWorkspaceInput } from "@/schemas/workspace";
import slugify from "slugify";
import { WorkspaceMember } from "@/models/workspace-member";
import { IWorkspace, WorkspaceContext } from "@/types/workspace";
import { config } from "@/config/env";
import { ApiError } from "@/utils/api-error";
import { canManageWorkspace } from "@/utils/permissions";
import { withTransaction } from "@/utils/with-transaction";
import { Project } from "@/models/project-model";
import { Task } from "@/models/task-model";
import { WorkspaceInvite } from "@/models/workspace-invites-model";


class WorkspaceService {
    async createWorkspace(ctx: WorkspaceContext, data: CreateWorkspaceInput) {
        const slug = slugify(data.name);
        const existingWorkspace = await Workspace.exists({ slug }).lean().exec();
        if (existingWorkspace) {
            throw new ApiError(400, 'Workspace with the same name already exists. Please choose a different name.');
        }

        return withTransaction(async (session) => {
            const [newWorkspace] = await Workspace.create([{
                ...data,
                slug,
                ownerId: ctx.userId,
            }], { session });

            if (!newWorkspace) {
                throw new ApiError(500, 'Failed to create workspace');
            }

            const workspaceMember = await WorkspaceMember.create([{
                workspaceId: newWorkspace._id,
                userId: ctx.userId,
                role: 'owner',
                joinedAt: new Date()
            }], { session });

            if (!workspaceMember) {
                throw new ApiError(500, 'Failed to create workspace member');
            }
            return {
                status: 201,
                message: 'Workspace created successfully',
                data: newWorkspace
            }
        })

    }

    async updateWorkspace(ctx: WorkspaceContext, data: UpdateWorkspaceInput) {
        const workspace = await Workspace.findOne({
            _id: ctx.workspaceId,
        }).select('slug ownerId').lean<Pick<IWorkspace, 'slug' | 'ownerId'>>().exec();

        if (!workspace) {
            throw new ApiError(404, 'Workspace not found');
        };

        if (!canManageWorkspace(ctx.workspaceId, workspace.ownerId.toString())) {
            throw new ApiError(403, 'You are not authorized to update this workspace');
        }
        const updatedWorkspace = await Workspace.findByIdAndUpdate(ctx.workspaceId, {
            $set: {
                ...data,
                slug: data.name ? slugify(data.name) : workspace.slug,
                updatedAt: new Date()
            }
        }, {
            new: true, runValidators: true
        })

        if (!updatedWorkspace) {
            throw new ApiError(500, 'Failed to update workspace');
        }

        return {
            status: 200,
            message: 'Workspace updated successfully',
            data: updatedWorkspace
        }
    }

    async deleteWorkspace(ctx: WorkspaceContext) {

        const workspace = await Workspace.findOne({
            _id: ctx.workspaceId, ownerId: ctx.userId
        }).select('ownerId').lean<Pick<IWorkspace, 'ownerId'>>().exec();
        if (!workspace) {
            throw new ApiError(404, 'Workspace not found');
        }

        if (!canManageWorkspace(ctx.workspaceId, workspace.ownerId.toString())) {
            throw new ApiError(403, 'You are not authorized to delete this workspace');
        }

        return withTransaction(async (session) => {
            // 1. Delete ALL PROJECTS, TASKS, INVITES, MEMBERS ASSOCIATED WITH THIS WORKSPACE
            await Promise.all([
                Project.deleteMany({ workspaceId: ctx.workspaceId }, { session }),
                Task.deleteMany({ workspaceId: ctx.workspaceId }, { session }),
                WorkspaceInvite.deleteMany({ workspaceId: ctx.workspaceId }, { session }),
                WorkspaceMember.deleteMany({ workspaceId: ctx.workspaceId }, { session })
            ]);
            // 2. DELETE WORKSPACE
            await Workspace.deleteOne({ _id: ctx.workspaceId }, { session });
            return {
                status: 200,
                message: 'Workspace and all associated data deleted successfully',
                data: null
            };
        })
    }

    async getWorkspaceDetails(ctx: WorkspaceContext) {
        const workspace = await Workspace.findById(ctx.workspaceId).populate({
            path: 'ownerId',
            select: '_id username ownerId fullName email profilePhoto'
        }).lean().exec();

        if (!workspace) {
            throw new ApiError(404, 'Workspace not found');
        }

        // Check if user is a member of the workspace
        const isMember = await WorkspaceMember.exists({
            workspaceId: ctx.workspaceId,
            userId: ctx.userId
        }).lean().exec();

        if (!isMember) {
            throw new ApiError(403, 'You are not authorized to view this workspace');
        }

        return {
            status: 200,
            message: 'Workspace details fetched successfully',
            data: workspace
        }
    }

    async getAllWorkspaces(ctx: WorkspaceContext, query: { limit?: string, page?: string }) {
        const limit = query.limit ? parseInt(query.limit, 10) : +config.DEFAULT_RESPONSE_LIMIT;
        const page = query.page ? parseInt(query.page, 10) : 1;
        const skip = (page - 1) * limit;

        // fetch workspaces where user is owner of( his workspaces ) or belong to ( invited workspaces )
        const workspaceIds = await WorkspaceMember.find({ userId: ctx.userId }).distinct('workspaceId').lean().exec();

        const [workspaces, total] = await Promise.all([
            Workspace.find({
                _id: { $in: workspaceIds }
            })
                .skip(skip)
                .limit(limit)
                .lean().exec(),
            Workspace.countDocuments({ _id: { $in: workspaceIds } }).exec()
        ])

        return {
            status: 200,
            message: 'Workspaces fetched successfully',
            data: {
                total,
                limit,
                page,
                workspaces,
            }
        }
    }
}

const workspaceService = new WorkspaceService();
export default workspaceService;
