import { IWorkspace, IWorkspaceSettings } from "@/types/workspace";
import mongoose, { HydratedDocument, model, Schema } from "mongoose";



const workspaceSettingsSchema = new Schema<IWorkspaceSettings>({
    theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light'
    },
    notifyOwnerOnMemberJoin: {
        type: Boolean,
        default: true
    },
    visibility: {
        type: String,
        enum: ['private', 'public'],
        default: 'private'
    },
    requireApproval: {
        type: Boolean,
        default: false
    },
    maxMembers: {
        type: Number,
        default: 50,
        min: [1, 'There must be at least 1 member'],
        max: [100, 'Max members cannot exceed 100']
    }
})

type WorkspaceDocument = HydratedDocument<IWorkspace>;

const workspaceSchema = new Schema<WorkspaceDocument>({
    name: {
        type: String,
        required: [true, 'Workspace name is required'],
        trim: true,
        minlength: [3, 'Workspace name must be at least 3 characters long'],
        maxlength: [50, 'Workspace name must be at most 50 characters long'],
    },
    slug: {
        type: String,
        required: [true, 'Workspace slug is required'],
        unique: true,
        index: true
    },
    description: {
        type: String,
        default: '',
    },
    icon: {
        type: String,
        default: '🏢'
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        required: [true, 'Owner ID is required']
    },
    settings: {
        type: workspaceSettingsSchema,
        default: {}
    },
    projectsCount: {
        type: Number,
        default: 0
    },
    membersCount: {
        type: Number,
        default: 1
    },
    storageUsed: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export const Workspace = mongoose.models?.workspace || model<WorkspaceDocument>('Workspace', workspaceSchema);