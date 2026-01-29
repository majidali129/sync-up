import { Types } from "mongoose";
import { USER_ROLE } from "./user";


export interface IWorkspaceSettings {
    theme: 'light' | 'dark';
    notifyOwnerOnMemberJoin: boolean;
    visibility: 'private' | 'public';
    requireApproval: boolean;
    maxMembers: number;
}

export interface IWorkspace {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    ownerId: Types.ObjectId;
    settings: IWorkspaceSettings;
    projectsCount: number;
    membersCount: number;
    storageUsed: number;
    createdAt: Date;
    updatedAt: Date;
}



export interface IWorkspaceMember {
    userId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    role: USER_ROLE;
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type INVITE_STATUS = 'pending' | 'accepted' | 'declined' | 'expired';
export interface IWorkspaceInvite {
    workspaceId: Types.ObjectId;
    invitedBy: Types.ObjectId;
    role: 'admin' | 'member'
    email: string;
    token: string;
    tokenExpiresAt: number;
    status: INVITE_STATUS;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkspaceContext {
    userId: string;
    workspaceId: string;
}

export interface WorkspaceInviteContext {
    userId: string,
    username: string,
    email: string,
    fullName: string
    workspaceId?: string;
}