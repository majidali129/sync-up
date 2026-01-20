import { Workspace } from "@/models/workspace-model";
import { UpdateWorkspaceInput, WorkspaceInput } from "@/schemas/workspace";
import slugify from "slugify";
import { Request } from "express";
import { WorkspaceMember } from "@/models/workspace-member";
// import mongoose from 'mongoose'



class WorkspaceService {
    async createWorkspace(req: Request, data: WorkspaceInput) {
        // Implementation here
        //TODO: Use Transactions to ensure both workspace and workspace member are created successfully
        const slug = slugify(data.name);
        const newWorkspace = await Workspace.create({
            ...data,
            slug,
            ownerId: req.user.id,
        });

        await WorkspaceMember.create({
            workspaceId: newWorkspace._id,
            userId: req.user.id,
            role: 'owner',
            joinedAt: new Date()
        });

        return {
            status: 201,
            message: 'Workspace created successfully',
            data: newWorkspace
        }

    }

    async updateWorkspace(req: Request, workspaceId: string, data: UpdateWorkspaceInput) {
        const workspace = await Workspace.findOne({
            _id: workspaceId,
        }).select('_id slug ownerId name description icon settings updatedAt').exec();

        if (!workspace) {
            return {
                status: 404,
                message: 'Workspace not found',
                data: null
            }
        };

        if (workspace.ownerId.toString() !== req.user.id) {
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

    async deleteWorkspace(req: Request, workspaceId: string) {
        const workspace = await Workspace.findOne({
            _id: workspaceId,
            ownerId: req.user.id
        });

        if (!workspace) {
            return {
                status: 404,
                message: 'Workspace not found or you are not authorized to delete this workspace',
                data: null
            }
        }

        // DELETE PROJECTS
        // DELETE TASKS
        // DELETE WORKSPACE INVITATIONS
        // DELETE WORKSPACE MEMBERS
        await WorkspaceMember.deleteMany({
            workspaceId
        });
        // FINALLY DELETE WORKSPACE
        await workspace.deleteOne({ _id: workspaceId })
        return {
            status: 200,
            message: 'Workspace deleted successfully',
            data: null
        }
    }

    async getWorkspaceDetails(req: Request, workspaceId: string) {
        const workspace = await Workspace.findById(workspaceId).populate({
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

    async getAllWorkspaces(query: any) {
        const workspaces = await Workspace.find({}).lean().exec();

        return {
            status: 200,
            message: 'Workspaces fetched successfully',
            data: workspaces
        }
    }
}

const workspaceService = new WorkspaceService();
export default workspaceService;
