import z from "zod";



export const workspaceInviteSchema = z.object({
    workspaceId: z.string().min(1, "Workspace ID is required"),
    role: z.enum(['admin', 'member', 'viewer'], { message: 'Role must be either admin, member, or viewer' }),
    email: z.email("Invalid email address").refine(email => email.length > 0, { message: "Email is required" }),
});

export const acceptInviteSchema = z.object({
    token: z.string().min(1, "Invite token is required"),
    workspaceId: z.string().min(1, "Workspace ID is required"),
});

export type WorkspaceInviteInput = z.infer<typeof workspaceInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;