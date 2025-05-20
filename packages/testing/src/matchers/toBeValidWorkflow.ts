import { createMatcher, validateSchema } from './utils.js';
import { WorkflowSchema } from '@the-new-fuse/core'; // Corrected import path (assuming schema is here)

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