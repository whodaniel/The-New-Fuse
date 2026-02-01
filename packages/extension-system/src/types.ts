import { z } from 'zod';

// Extension Manifest Schema
export const ExtensionManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  type: z.enum(['module', 'workflow-node', 'skill', 'theme'] as const),
  main: z.string().optional(), // Entry point
  permissions: z.array(z.string()).default([]),
  dependencies: z.record(z.string()).optional(),
  config: z.record(z.any()).optional(),
});

export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;

export interface Extension {
  id: string;
  manifest: ExtensionManifest;
  status: 'installed' | 'enabled' | 'disabled' | 'error';
  path: string;
  error?: string;
  loadedAt?: Date;
}

export interface ExtensionRegistry {
  register(manifest: ExtensionManifest): Promise<void>;
  unregister(id: string): Promise<void>;
  get(id: string): Extension | undefined;
  list(): Extension[];

  load(id: string): Promise<void>;
  unload(id: string): Promise<void>;
}
