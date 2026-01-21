import { IProject } from "@/types/project";
import mongoose, { HydratedDocument, model, Schema } from "mongoose";

type ProjectDocument = HydratedDocument<IProject>;

// const projectMemberSchema = new Schema({
//     id: {
//         type: Schema.Types.ObjectId,
//         ref: 'User',
//         required: [true, 'Member ID is required'],
//     },
//     username: {
//         type: String,
//         required: [true, 'Member username is required'],
//     }
// })

const projectSchema = new Schema<ProjectDocument>({
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'Workspace ID is required'],
    },
    // key: {
    //     type: String,
    //     trim: true,
    //     unique: true,
    //     required: [true, 'Project key is required'],
    // },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Workspace admin or owner ID is required'],
    },
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: []
        }
    ],
    icon: String,
    color: String,
    status: {
        type: String,
        enum: {
            values: ['active', 'on-hold', 'completed', 'archived'],
            message: 'Status must be one of active, on-hold, completed, or archived',
        },
        default: 'active'
    },
    visibility: {
        type: String,
        enum: {
            values: ['private', 'public'],
            message: 'Visibility must be either private or public',
        }
    },
    startDate: Date,
    endDate: Date,
    stats: {
        totalTasks: { type: Number, default: 0 },
        completedTasks: { type: Number, default: 0 },
        inProgressTasks: { type: Number, default: 0 },
        overdueTasks: { type: Number, default: 0 },
    },
    tags: [String],
}, { timestamps: true })

export const Project = mongoose.models?.Project || model<ProjectDocument>('Project', projectSchema);