import { Workspace } from "@/models/workspace-model";
import { UpdateWorkspaceInput, CreateWorkspaceInput } from "@/schemas/workspace";
import slugify from "slugify";
import { WorkspaceMember } from "@/models/workspace-member";
import { WorkspaceContext } from "@/types/workspace";
import { config } from "@/config/env";
import { ApiError } from "@/utils/api-error";
import { WorkspaceAuditLog } from "@/models/workspace-audit-log";
import { canManageWorkspace } from "@/utils/permissions";


class WorkspaceService {
    async createWorkspace(ctx: WorkspaceContext, data: CreateWorkspaceInput) {
        //TODO: Use Transactions to ensure both workspace and workspace member are created successfully
        const slug = slugify(data.name);
        const existingWorkspace = await Workspace.exists({ slug }).lean().exec();
        if (existingWorkspace) {
            throw new ApiError(400, 'Workspace with the same name already exists. Please choose a different name.');
        }
        const newWorkspace = await Workspace.create({
            ...data,
            slug,
            ownerId: ctx.userId,
        });

        if (!newWorkspace) {
            throw new ApiError(500, 'Failed to create workspace');
        }

        const workspaceMember = await WorkspaceMember.create({
            workspaceId: newWorkspace._id,
            userId: ctx.userId,
            role: 'owner',
            joinedAt: new Date()
        });

        if (!workspaceMember) {
            throw new ApiError(500, 'Failed to create workspace member');
        }


        await Promise.all([
            WorkspaceAuditLog.create({
                workspaceId: ctx.workspaceId,
                resourceType: 'workspace',
                resourceId: newWorkspace._id,
                action: 'created',
                performedBy: ctx.userId,
                timestamp: new Date(),
                description: `Workspace titled "${newWorkspace.name}" was created`
            }),
            WorkspaceAuditLog.create({
                workspaceId: ctx.workspaceId,
                resourceType: 'member',
                resourceId: workspaceMember._id,
                action: 'member_added',
                performedBy: ctx.userId,
                timestamp: new Date(),
                description: `Member with ID "${workspaceMember.userId}" was added as owner to the workspace`
            })
        ])

        return {
            status: 201,
            message: 'Workspace created successfully',
            data: newWorkspace
        }

    }

    async updateWorkspace(ctx: WorkspaceContext, data: UpdateWorkspaceInput) {
        const workspace = await Workspace.findOne({
            _id: ctx.workspaceId,
        }).select('_id slug ownerId name description icon settings updatedAt').exec();

        if (!workspace) {
            throw new ApiError(404, 'Workspace not found');
        };
        if (!canManageWorkspace(ctx.workspaceId, workspace.ownerId.toString())) {
            throw new ApiError(403, 'You are not authorized to update this workspace');
        }

        workspace.slug = data.name ? slugify(data.name) : workspace.slug;
        workspace.name = data.name || workspace.name;
        workspace.description = data.description || workspace.description;
        workspace.icon = data.icon || workspace.icon;
        workspace.settings = data.settings || workspace.settings;
        workspace.updatedAt = new Date();

        const updatedWorkspace = await workspace.save({ validateBeforeSave: true });

        if (!updatedWorkspace) {
            throw new ApiError(500, 'Failed to update workspace');
        }
        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'workspace',
            resourceId: updatedWorkspace._id,
            action: 'updated',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Workspace titled "${updatedWorkspace.name}" was updated`
        })

        return {
            status: 200,
            message: 'Workspace updated successfully',
            data: updatedWorkspace
        }
    }

    async deleteWorkspace(ctx: WorkspaceContext) {

        const workspace = await Workspace.findOne({
            _id: ctx.workspaceId, ownerId: ctx.userId
        });
        if (!workspace) {
            throw new ApiError(404, 'Workspace not found');
        }

        if (!canManageWorkspace(ctx.workspaceId, workspace.ownerId.toString())) {
            throw new ApiError(403, 'You are not authorized to delete this workspace');
        }

        //TODO: Use Transactions to ensure all related data is deleted successfully
        // DELETE PROJECTS
        // DELETE TASKS
        // DELETE WORKSPACE INVITATIONS
        // DELETE WORKSPACE MEMBERS
        // await WorkspaceMember.deleteMany({
        //     workspaceId: ctx.workspaceId
        // });
        // FINALLY DELETE WORKSPACE
        const result = await workspace.deleteOne({ _id: ctx.workspaceId })
        if (result.deletedCount === 0) {
            throw new ApiError(500, 'Failed to delete workspace');
        }

        await WorkspaceAuditLog.create({
            workspaceId: ctx.workspaceId,
            resourceType: 'workspace',
            resourceId: workspace._id,
            action: 'deleted',
            performedBy: ctx.userId,
            timestamp: new Date(),
            description: `Workspace titled "${workspace.name}" was deleted`
        })
        return {
            status: 200,
            message: 'Workspace deleted successfully',
            data: null
        }
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
