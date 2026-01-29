import { WorkspaceAuditLog } from "@/models/workspace-audit-log"
import { IWorkspaceAuditLog } from "@/types/workspace";



export const performAudit = async (workspaceId: string, resourceType: IWorkspaceAuditLog['resourceType'], resourceId: string, action: IWorkspaceAuditLog['action'], userId: string, desc: string) => {
    await WorkspaceAuditLog.create({
        workspaceId,
        resourceType,
        resourceId,
        action,
        performedBy: userId,
        timestamp: new Date(),
        description: desc
    });
}
