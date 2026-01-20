import { IWorkspaceMember } from "@/types/workspace";
import mongoose, { HydratedDocument, model, Schema } from "mongoose";

type WorkspaceMemberDocument = HydratedDocument<IWorkspaceMember>

const workspaceMemberSchema = new Schema<WorkspaceMemberDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'Workspace reference is required']
    },
    role: {
        type: String,
        enum: ['admin', 'owner', 'member', 'viewer'],
        default: 'owner',
        required: [true, 'Role is required']
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
}, { timestamps: true });

export const WorkspaceMember = mongoose.models?.WorkspaceMember || model<WorkspaceMemberDocument>('WorkspaceMember', workspaceMemberSchema);