import { ObjectId } from "mongoose";
import { USER_ROLE } from "./user";

export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'archived';
export type ProjectVisibility = 'private' | 'public';
export type ProjectStats = {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
}

export interface IProject {
    name: string;
    slug: string;
    description?: string;
    workspaceId: ObjectId;
    createdBy: ObjectId;
    members: ObjectId[];
    icon?: string; // URL or EMOJI
    color?: string;
    status: ProjectStatus;
    visibility: ProjectVisibility;
    startDate?: Date;
    endDate?: Date;
    stats: ProjectStats
    tags?: string[]
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectContext {
    userId: string;
    userRole: USER_ROLE;
    workspaceId: string;
    projectId?: string;
}