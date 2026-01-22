import { ObjectId } from "mongoose";
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
    workspaceId: ObjectId;
    projectId: ObjectId;
    title: string;
    slug: string;
    description?: string;
    type: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    isPersonal?: boolean;
    assignee?: ObjectId;
    creator: ObjectId;
    estimatedTime: number; // minutes
    actualTime?: number;
    dueDate: Date;
    tags?: string[];
    completedAt?: Date;
    parentTask?: ObjectId;
    subtasks?: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskContext {
    userId: string;
    userRole: USER_ROLE;
    projectId: string;
    workspaceId: string;
    taskId?: string;
}