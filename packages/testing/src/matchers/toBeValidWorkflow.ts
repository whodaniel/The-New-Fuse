import { createMatcher, validateSchema } from './utils.js';
import { z } from 'zod';

// Local WorkflowSchema definition to avoid circular dependencies
const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ERROR']),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ERROR']).optional()
  })).optional()
});

export const toBeValidWorkflow = createMatcher(
  (received) => {
    const { success } = validateSchema(received, WorkflowSchema);
    return success;
  },
  (received) => {
    const { error } = validateSchema(received, WorkflowSchema);
    return `Expected value to be a valid workflow, but validation failed:\n${error}`;
  },
  () => 'Expected value not to be a valid workflow'
);