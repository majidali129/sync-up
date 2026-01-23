import z from "zod";



export const workspaceInviteSchema = z.object({
    role: z.enum(['admin', 'member'], { message: 'Role must be either admin or member' }),
    email: z.email("Invalid email address").refine(email => email.length > 0, { message: "Email is required" }),
});

export const acceptInviteSchema = z.object({
    token: z.string().min(1, "Invite token is required"),
});

export type WorkspaceInviteInput = z.infer<typeof workspaceInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;