"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBeValidWorkflow = void 0;
const utils_js_1 = require("./utils.js");
const zod_1 = require("zod");
// Local WorkflowSchema definition to avoid circular dependencies
const WorkflowSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ERROR']),
    createdAt: zod_1.z.string().or(zod_1.z.date()),
    updatedAt: zod_1.z.string().or(zod_1.z.date()),
    steps: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ERROR']).optional()
    })).optional()
});
exports.toBeValidWorkflow = (0, utils_js_1.createMatcher)((received) => {
    const { success } = (0, utils_js_1.validateSchema)(received, WorkflowSchema);
    return success;
}, (received) => {
    const { error } = (0, utils_js_1.validateSchema)(received, WorkflowSchema);
    return `Expected value to be a valid workflow, but validation failed:\n${error}`;
}, () => 'Expected value not to be a valid workflow');
//# sourceMappingURL=toBeValidWorkflow.js.map