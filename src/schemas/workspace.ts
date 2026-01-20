import z from "zod";



export const createWorkspaceSchema = z.object({
    name: z
        .string()
        .min(3, "Workspace name must be at least 3 characters")
        .max(50, "Workspace name cannot exceed 50 characters")
        .trim(),
    description: z
        .string().optional(),
    icon: z
        .string().optional(),
    settings: z.object({
        visibility: z.enum(['private', 'public']).default('private'),
        requireApproval: z.boolean().default(false),
        maxMembers: z.number().min(1, "There must be at least 1 member").max(100, "Max members cannot exceed 100").default(50),
    })
});

export const updateWorkspaceSchema = z.object({
    name: z
        .string().optional(),
    description: z
        .string().optional(),
    icon: z
        .string().optional(),
    settings: z.object({
        visibility: z.enum(['private', 'public']).optional(),
        requireApproval: z.boolean().optional(),
        maxMembers: z.number().min(1, "There must be at least 1 member").max(100, "Max members cannot exceed 100").optional(),
    }).optional()
});


export type WorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;