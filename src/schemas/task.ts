import z from "zod";


export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    type: z.enum(["feature", "bug", "documentation", "test", "other"], 'Task type could be either feature, bug, documentation, test or other').default("other"),
    priority: z.enum(["low", "medium", "high", "urgent"], 'Task priority could be either low, medium, high or urgent').default("medium"),
    estimatedTime: z.coerce.number().min(1, "Estimated time is required in minutes"),
    dueDate: z.coerce.date().min(new Date(), "Due date must be in the future"),
    tags: z.array(z.string()).optional(),
    parentTask: z.string().optional()
});


export const updateTaskSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    type: z.enum(["feature", "bug", "documentation", "test", "other"], 'Task type could be either feature, bug, documentation, test or other').optional(),
    priority: z.enum(["low", "medium", "high", "urgent"], 'Task priority could be either low, medium, high or urgent').optional(),
    estimatedTime: z.coerce.number().min(1, "Estimated time is required in minutes").optional(),
    dueDate: z.coerce.date().min(new Date(), "Due date must be in the future").optional(),
    tags: z.array(z.string()).optional(),
    parentTask: z.string().optional()
});

export const toggleTaskStatusSchema = z.object({
    status: z.enum(["todo", "in_progress", "review", "done", "blocked"], 'Task status could be either todo, in_progress, review, done or blocked'),
    actualTime: z.coerce.number().min(0, "Actual time must be a non-negative number").optional()
});

export const assignTaskSchema = z.object({
    assigneeId: z.string().min(1, "Assignee ID is required")
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = Partial<CreateTaskInput>;
export type ToggleTaskStatusInput = z.infer<typeof toggleTaskStatusSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;