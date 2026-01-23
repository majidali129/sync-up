import { ITask, TaskStatus } from "@/types/task";
import mongoose, { HydratedDocument, model, Schema } from "mongoose";

type TaskDocument = HydratedDocument<ITask>;

const taskSchema = new Schema<TaskDocument>({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'Workspace ID is required'],
        index: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID is required'],
        index: true
    },
    title: {
        type: String,
        required: [true, 'Title is required']
    },
    slug: {
        type: String,
        unique: [true, 'Task slug must be unique'],
        required: [true, 'Task slug is required'],
        index: true,
    },
    description: String,
    type: {
        type: String,
        enum: {
            values: ["feature", "bug", "documentation", "test", "other"],
            message: "Task could be either feature, bug, documentation, test or other",
            default: 'other'
        },
        required: [true, 'Task type is required']
    },
    priority: {
        type: String,
        enum: {
            values: ["low", "medium", "high", "urgent"],
            message: "Task priority could be either low, medium, high or urgent",
            default: 'medium'
        },
        required: [true, 'Task priority is required']
    },
    status: {
        type: String,
        enum: {
            values: ["todo", "in progress", 'review', "done", "blocked"],
            message: "Task status could be either todo, in progress, review, done or blocked",
        },
        default: TaskStatus.TODO,
        required: [true, 'Task status is required'],
        index: true
    },
    isPersonal: {
        type: Boolean,
        default: true
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Task creator is required']
    },
    estimatedTime: {
        type: Number,
        required: [true, 'Estimated time is required']
    },
    actualTime: Number,
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    },
    tags: [String],
    completedAt: Date,
    parentTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null
    },
    subtasks: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Task'
            }
        ],
        default: []
    }
}, { timestamps: true });



export const Task = mongoose.models?.Task || model<TaskDocument>('Task', taskSchema);