
export {}
exports.TaskResponseDtoSchema = exports.UpdateTaskDtoSchema = exports.CreateTaskDtoSchema = exports.TaskResultSchema = exports.TaskSchema = exports.TaskExecutionSchema = exports.TaskPriority = exports.TaskStatus = exports.TaskPrioritySchema = exports.TaskStatusSchema = exports.TaskOutputSchema = exports.TaskInputSchema = void 0;
import zod_1 from 'zod';
// Base schemas
exports.TaskInputSchema = zod_1.z.object({
    prompt: zod_1.z.string(),
    context: zod_1.z.record(zod_1.z.unknown()).optional(),
    parameters: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.TaskOutputSchema = zod_1.z.object({
    result: zod_1.z.unknown(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Status and Priority enums
exports.TaskStatusSchema = zod_1.z.enum([
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
]);
exports.TaskPrioritySchema = zod_1.z.enum([
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT',
]);
// Export enums
exports.TaskStatus = exports.TaskStatusSchema.enum;
exports.TaskPriority = exports.TaskPrioritySchema.enum;
// Task execution schema
exports.TaskExecutionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    startTime: zod_1.z.number(),
    endTime: zod_1.z.number().optional(),
    status: exports.TaskStatusSchema,
    priority: exports.TaskPrioritySchema,
    retries: zod_1.z.number().default(0),
    error: zod_1.z.string().optional(),
});
// Task schema
exports.TaskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    status: exports.TaskStatusSchema,
    priority: exports.TaskPrioritySchema,
    input: exports.TaskInputSchema,
    output: exports.TaskOutputSchema.optional(),
    execution: exports.TaskExecutionSchema.optional(),
    error: zod_1.z.string().optional(),
    retries: zod_1.z.number().default(0),
    dependencies: zod_1.z.array(zod_1.z.string()).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Task result schema
exports.TaskResultSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.unknown().optional(),
    error: zod_1.z.string().optional(),
});
// DTOs
exports.CreateTaskDtoSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    priority: exports.TaskPrioritySchema,
    input: exports.TaskInputSchema,
    dependencies: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.UpdateTaskDtoSchema = exports.CreateTaskDtoSchema.partial().extend({
    status: exports.TaskStatusSchema.optional(),
    output: exports.TaskOutputSchema.optional(),
    error: zod_1.z.string().optional(),
});
exports.TaskResponseDtoSchema = exports.TaskSchema.extend({
    result: exports.TaskResultSchema.optional(),
});
//# sourceMappingURL=task.js.mapexport {};
