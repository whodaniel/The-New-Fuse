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

export type TnfIdentityCategory = z.infer<typeof TnfIdentityCategorySchema>;

export interface TnfCanonicalEntityParts {
  scope?: string | null;
  category: string;
  provider: string;
  name: string;
  instance?: string | number | null;
}

export interface TnfAgentIdentityRecord {
  canonicalEntityId?: string | null;
  operationalHandle: string;
  runtimeSessionId?: string | null;
  aliases: string[];
}
