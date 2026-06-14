import { z } from 'zod';
export const TnfIdentityCategorySchema = z.enum([
    'AGENT',
    'SESSION',
    'CHANNEL',
    'WORKFLOW',
    'TASK',
    'SCHEDULE',
    'HARNESS',
    'MCP',
    'LLM',
    'USER',
    'SYSTEM',
]);
//# sourceMappingURL=identity.js.map