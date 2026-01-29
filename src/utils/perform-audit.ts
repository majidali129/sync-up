import { WorkspaceAuditLog } from "@/models/workspace-audit-log"
import { IWorkspaceAuditLog } from "@/types/workspace";
import { ClientSession } from "mongoose";



export const performAudit = async (workspaceId: string, resourceType: IWorkspaceAuditLog['resourceType'], resourceId: string, action: IWorkspaceAuditLog['action'], userId: string, desc: string, session?: ClientSession) => {
    await WorkspaceAuditLog.create({
        workspaceId,
        resourceType,
        resourceId,
        action,
        performedBy: userId,
        timestamp: new Date(),
        description: desc
    }, { session });
}
