import { IWorkspaceAuditLog } from "@/types/workspace";
import mongoose, { HydratedDocument, model, Schema } from "mongoose";


type WorkspaceAuditLogDocument = HydratedDocument<IWorkspaceAuditLog>;
const workspaceAuditLogSchema = new Schema<WorkspaceAuditLogDocument>({
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'Workspace ID is required'],
        index: true
    },
    resourceType: {
        type: String,
        required: [true, 'Resource type is required'],
        index: true
    },
    resourceId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Resource ID is required'],
        index: true
    },
    action: {
        type: String,
        required: [true, 'Action is required']
    },
    performedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'PerformedBy field is required'],
        index: true
    },

    // changes: {
    //     type: [
    //         {
    //             field: { type: String, required: true },
    //             oldValue: { type: Schema.Types.Mixed },
    //             newValue: { type: Schema.Types.Mixed }
    //         }
    //     ],
    //     default: [
    //     ]
    // },
    timestamp: {
        type: Date,
        required: [true, 'Timestamp is required'],
        default: Date.now,
        index: true
    },
    ipAddress: { type: String }
}, { timestamps: true });


export const WorkspaceAuditLog = mongoose.models?.WorkspaceAuditLog || model<WorkspaceAuditLogDocument>('WorkspaceAuditLog', workspaceAuditLogSchema);