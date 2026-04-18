import { Injectable, Logger } from '@nestjs/common';
import { db } from '@the-new-fuse/database';
import { tnfAgentDefinitions } from '@the-new-fuse/database/drizzle/schema';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AgentProfileVectorService } from './agent-profile-vector.service.js';

type SnapshotEntry = {
  id?: string;
  tnfId?: string;
  name?: string;
  displayName?: string;
  description?: string;
  agentType?: string;
  accessLevel?: string;
  isSystem?: boolean;
  sourceFile?: string;
  tools?: string[];
  inferredTools?: string[];
  skills?: string[];
  capabilities?: string[];
  tags?: string[];
  systemPrompt?: string;
  personaSource?: string;
  avatarUrl?: string;
  version?: string;
  status?: string;
  mcpIds?: string[];
};

@Injectable()
export class AgentRegistryImportService {
  private readonly logger = new Logger(AgentRegistryImportService.name);

  constructor(private readonly agentProfileVectorService: AgentProfileVectorService) {}

  private getRepoRoot() {
    return process.env.AGENT_REGISTRY_REPO_ROOT || path.resolve(process.cwd(), '../../..');
  }

  private resolveSnapshotPath(snapshotPath: string) {
    const repoRoot = this.getRepoRoot();
    return path.isAbsolute(snapshotPath) ? snapshotPath : path.join(repoRoot, snapshotPath);
  }

  private normalizeArray(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    return input.map((value) => String(value).trim()).filter(Boolean);
  }

  private mergeUnique(...inputs: unknown[]): string[] {
    const merged = new Set<string>();
    for (const input of inputs) {
      for (const value of this.normalizeArray(input)) {
        merged.add(value);
      }
    }
    return Array.from(merged);
  }

  private normalizeAccessLevel(accessLevel?: string) {
    if (!accessLevel) return 'user';
    const normalized = accessLevel.toLowerCase();
    const allowed = new Set(['superadmin', 'admin', 'dev', 'user', 'guest']);
    return allowed.has(normalized) ? normalized : 'user';
  }

  private normalizeSourcePath(sourceFile?: string | null) {
    if (!sourceFile) return null;
    if (!path.isAbsolute(sourceFile)) return sourceFile;

    const repoRoot = this.getRepoRoot();
    const relative = path.relative(repoRoot, sourceFile);
    if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
      return relative;
    }

    return path.basename(sourceFile);
  }

  async importSnapshot(snapshotPath?: string, onlyType?: string) {
    const requestedPath = snapshotPath?.trim() || 'data/agent-registry/agents.json';
    const reportedPath = this.normalizeSourcePath(requestedPath) || requestedPath;
    const resolved = this.resolveSnapshotPath(requestedPath);
    const raw = await fs.readFile(resolved, 'utf8');
    const entries: SnapshotEntry[] = JSON.parse(raw);
    const onlyTypeNormalized = onlyType?.trim().toLowerCase();

    const result = {
      ok: true,
      snapshotPath: reportedPath,
      total: entries.length,
      imported: 0,
      skipped: 0,
      vectorReindex: null as unknown,
      errors: [] as { id: string; error: string }[],
    };
    const importedTnfIds: string[] = [];

    for (const entry of entries) {
      const tnfId = entry.id || entry.tnfId || entry.name;
      if (!tnfId) {
        result.skipped += 1;
        continue;
      }

      if (onlyTypeNormalized) {
        const entryType = entry.agentType?.toLowerCase();
        if (!entryType || entryType !== onlyTypeNormalized) {
          result.skipped += 1;
          continue;
        }
      }

      const skills = this.mergeUnique(entry.skills, entry.tools, entry.inferredTools);
      const tags = this.normalizeArray(entry.tags || []);
      const capabilities = this.normalizeArray(entry.capabilities || []);
      const mcpIds = this.normalizeArray(entry.mcpIds || []);
      const sourceFile = this.normalizeSourcePath(entry.sourceFile);
      const definitionSource = sourceFile || null;
      const definitionFormat = sourceFile ? path.extname(sourceFile).replace('.', '') : null;
      const agentType = entry.agentType || 'GENERIC';
      const accessLevel = this.normalizeAccessLevel(entry.accessLevel);
      const isSystem = Boolean(entry.isSystem);
      const systemPrompt = typeof entry.systemPrompt === 'string' ? entry.systemPrompt : undefined;
      const personaSource =
        typeof entry.personaSource === 'string' ? entry.personaSource : undefined;
      const avatarUrl = typeof entry.avatarUrl === 'string' ? entry.avatarUrl : undefined;
      const version = typeof entry.version === 'string' ? entry.version : undefined;

      const metadata = {
        sourceFile,
        tools: this.normalizeArray(entry.tools || []),
        inferredTools: this.normalizeArray(entry.inferredTools || []),
        status: entry.status || null,
      };

      const insertValues = {
        tnfId,
        name: entry.displayName || entry.name || tnfId,
        description: entry.description || null,
        definitionSource,
        definitionFormat,
        skills,
        capabilities,
        tags,
        mcpIds,
        agentType,
        accessLevel,
        isSystem,
        metadata,
        updatedAt: new Date(),
        createdAt: new Date(),
      } as const;

      const updateValues = {
        name: entry.displayName || entry.name || tnfId,
        description: entry.description || null,
        definitionSource,
        definitionFormat,
        skills,
        capabilities,
        tags,
        mcpIds,
        agentType,
        accessLevel,
        isSystem,
        metadata,
        updatedAt: new Date(),
      } as const;

      if (systemPrompt !== undefined) {
        (insertValues as any).systemPrompt = systemPrompt;
        (updateValues as any).systemPrompt = systemPrompt;
      }
      if (personaSource !== undefined) {
        (insertValues as any).personaSource = personaSource;
        (updateValues as any).personaSource = personaSource;
      }
      if (avatarUrl !== undefined) {
        (insertValues as any).avatarUrl = avatarUrl;
        (updateValues as any).avatarUrl = avatarUrl;
      }
      if (version !== undefined) {
        (insertValues as any).version = version;
        (updateValues as any).version = version;
      }

      try {
        await db.insert(tnfAgentDefinitions).values(insertValues).onConflictDoUpdate({
          target: tnfAgentDefinitions.tnfId,
          set: updateValues,
        });

        result.imported += 1;
        importedTnfIds.push(tnfId);
      } catch (error: any) {
        result.ok = false;
        result.errors.push({ id: tnfId, error: error?.message || String(error) });
        this.logger.error(`Failed to upsert ${tnfId}: ${error?.message || error}`);
      }
    }

    if (importedTnfIds.length > 0) {
      try {
        result.vectorReindex = await this.agentProfileVectorService.reindexByTnfIds(importedTnfIds);
      } catch (error: any) {
        result.ok = false;
        const message = error?.message || String(error);
        result.errors.push({ id: 'vector-reindex', error: message });
        this.logger.error(`Vector reindex failed after snapshot import: ${message}`);
      }
    }

    return result;
  }
}
