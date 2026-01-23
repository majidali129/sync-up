import { Workspace } from "@/models/workspace-model";
import { UpdateWorkspaceInput, WorkspaceInput } from "@/schemas/workspace";
import slugify from "slugify";
import { WorkspaceMember } from "@/models/workspace-member";
import { WorkspaceContext } from "@/types/workspace";
import { config } from "@/config/env";


class WorkspaceService {
    async createWorkspace(ctx: WorkspaceContext, data: WorkspaceInput) {
        //TODO: Use Transactions to ensure both workspace and workspace member are created successfully
        const slug = slugify(data.name);
        const newWorkspace = await Workspace.create({
            ...data,
            slug,
            ownerId: ctx.userId,
        });

        await WorkspaceMember.create({
            workspaceId: newWorkspace._id,
            userId: ctx.userId,
            role: 'owner',
            joinedAt: new Date()
        });

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
            return {
                status: 404,
                message: 'Workspace not found',
                data: null
            }
        };

        if (workspace.ownerId.toString() !== ctx.userId) {
            return {
                status: 403,
                message: 'You are not authorized to update this workspace',
                data: null
            }
        };

        workspace.slug = data.name ? slugify(data.name) : workspace.slug;
        workspace.name = data.name || workspace.name;
        workspace.description = data.description || workspace.description;
        workspace.icon = data.icon || workspace.icon;
        workspace.settings = data.settings || workspace.settings;
        workspace.updatedAt = new Date();

        await workspace.save({ validateBeforeSave: true });

        return {
            status: 200,
            message: 'Workspace updated successfully',
            data: workspace
        }
    }

    async deleteWorkspace(ctx: WorkspaceContext) {
        const workspace = await Workspace.findOne({
            _id: ctx.workspaceId, ownerId: ctx.userId
        });
        if (!workspace) {
            return {
                status: 404,
                message: 'Workspace not found or you are not authorized to delete this workspace',
                data: null
            }
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
        // await workspace.deleteOne({ _id: ctx.workspaceId })
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
            return {
                status: 404,
                message: 'Workspace not found',
                data: null
            }
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
