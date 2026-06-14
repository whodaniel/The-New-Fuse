import { z } from 'zod';
export const TaskSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['REQUIRED', 'OPTIONAL', 'BACKGROUND']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']),
    data: z.any(),
    metadata: z.object({
        title: z.string(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        dueDate: z.date().optional(),
    }),
    dependencies: z.array(z.string()).optional(),
});
//# sourceMappingURL=TaskTypes.js.map