import { ObjectId } from "mongoose";
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
    ownerId: ObjectId;
    settings: IWorkspaceSettings;
    projectsCount: number;
    membersCount: number;
    storageUsed: number;
    createdAt: Date;
    updatedAt: Date;
}



export interface IWorkspaceMember {
    userId: ObjectId;
    workspaceId: ObjectId;
    role: USER_ROLE;
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type INVITE_STATUS = 'pending' | 'accepted' | 'declined' | 'expired';
export interface IWorkspaceInvite {
    workspaceId: ObjectId;
    invitedBy: ObjectId;
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

export interface IWorkspaceAuditLog {
    workspaceId: ObjectId;
    resourceType: 'project' | 'task' | 'member' | 'setting' | 'workspace';
    resourceId: ObjectId;
    action: 'created' | 'updated' | 'deleted' | 'joined' | 'left' | 'invited' | 'assign' | 'unassign' | 'member_added' | 'member_removed' | 'setting_changed';
    performedBy: ObjectId;
    // changes: {
    //     field: string;
    //     oldValue: any;
    //     newValue: any;
    // }[];
    timestamp: Date;
    ipAddress?: string;
}