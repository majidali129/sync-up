import { Types } from "mongoose";
import { USER_ROLE } from "./user";


export enum TaskType {
    FEATURE = "feature",
    BUG = "bug",
    DOCUMENTATION = "documentation",
    TEST = "test",
    OTHER = "other"
}

export enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export enum TaskStatus {
    TODO = "todo",
    IN_PROGRESS = "in_progress",
    REVIEW = "review",
    DONE = "done",
    BLOCKED = "blocked",
    ARCHIVED = "archived"
}
export interface ITask {
    workspaceId: Types.ObjectId;
    projectId: Types.ObjectId;
    title: string;
    slug: string;
    description?: string;
    type: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    isPrivate: boolean;
    assignee?: Types.ObjectId;
    creator: Types.ObjectId;
    estimatedTime: number; // minutes
    actualTime?: number;
    dueDate: Date;
    tags?: string[];
    completedAt?: Date;
    parentTask?: Types.ObjectId;
    subtasks?: Types.ObjectId[];
    lastModifiedAt: Date;
    lastModifiedBy?: Types.ObjectId;
    completedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskContext {
    userId: string;
    userRole: USER_ROLE;
    projectId: string;
    workspaceId: string;
    taskId?: string;
    isProjectMember: boolean;
}