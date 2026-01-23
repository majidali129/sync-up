import { IWorkspaceInvite } from "@/types/workspace";
import mongoose, { HydratedDocument, model, Schema } from "mongoose";


type WorkspaceInviteDocument = HydratedDocument<IWorkspaceInvite>;
const workspaceInviteSchema = new Schema<WorkspaceInviteDocument>({
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'Workspace ID is required'],
        index: true
    },
    invitedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Workspace owner ID is required']
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'member'],
            message: 'Role must be either admin, member'
        },
        required: [true, 'Role is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        index: true
    },
    token: {
        type: String,
        required: [true, 'Invite token is required']
    },
    tokenExpiresAt: {
        type: Number,
        required: [true, 'Token expiry is required'],
        index: true,
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'accepted', 'declined', 'expired'],
            message: 'Status must be either pending, accepted, declined, or expired'
        },
        required: [true, 'Status is required'],
        default: 'pending'
    }
}, {
    timestamps: true
})



export const WorkspaceInvite = mongoose.models?.WorkspaceInvite || model<WorkspaceInviteDocument>('WorkspaceInvite', workspaceInviteSchema);