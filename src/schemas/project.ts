import z from "zod";


export const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').trim(),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    visibility: z.enum(['private', 'public'], 'Visibility must be either private or public').default('private'),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').trim().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    status: z.enum(['active', 'on-hold', 'completed', 'archived'], 'Status must be one of active, on-hold, completed, or archived').optional(),
    visibility: z.enum(['private', 'public'], 'Visibility must be either private or public').optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
});

export const updateProjectStatusSchema = z.object({
    status: z.enum(['active', 'on-hold', 'completed', 'archived'], 'Status must be one of active, on-hold, completed, or archived'),
})

export const addMemberToProjectSchema = z.object({
    memberId: z.string().min(1, 'Member ID is required').trim(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = Partial<CreateProjectInput>;
export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusSchema>;
export type AddMemberToProjectInput = z.infer<typeof addMemberToProjectSchema>;