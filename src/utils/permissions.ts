import { IProject } from "@/types/project";
import { USER_ROLE } from "@/types/user";
import { ObjectId } from "mongoose";

export const canManageWorkspace = (userId: string, creatorId: string) => {
    return userId === creatorId;
};
export const canManageProject = (userId: string, userRole: USER_ROLE, projectCreatorId: string) => {
    if (userRole === 'owner' || userId === projectCreatorId) return true;
    return false;
};
export const canEditTaskContent = (userRole: USER_ROLE, userId: string, taskCreatorId: string) => {
    if (userRole === 'owner' || userRole === 'admin') return true;
    if (userRole === 'member' && userId === taskCreatorId) return true;
    return false;
}
export const canUpdateTaskStatus = (userRole: USER_ROLE, userId: string, taskCreatorId: string, taskAssignees: string[]) => {
    if (userRole === 'owner' || userRole === 'admin') return true;
    if (userRole === 'member') {
        if (userId === taskCreatorId) return true;
        if (taskAssignees.some(assigneeId => assigneeId === userId)) return true;
    }
    return false;
}
export const canAssignTasks = (userRole: USER_ROLE) => {
    return userRole === 'owner' || userRole === 'admin';
};
export const canViewProject = (userRole: USER_ROLE, userId: string, projectVisibility: IProject['visibility'], projectCreatorId: string, projectMembers: ObjectId[]) => {
    if (projectVisibility === 'public' || userRole === 'owner') return true;
    if (projectCreatorId === userId) return true;
    if (projectMembers.some(memberId => memberId.toString() === userId)) return true;
    return false;
}

export const canDeleteTask = (userRole: USER_ROLE, userId: string, taskCreatorId: string) => {
    if (userRole === 'owner' || userRole === 'admin') return true;
    if (userRole === 'member') {
        if (userId === taskCreatorId) return true;
    };

    return false;
}
