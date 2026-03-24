import { Injectable, Logger } from '@nestjs/common';
import { db } from '@the-new-fuse/database';
import { tnfAgentDefinitions } from '@the-new-fuse/database/drizzle/schema';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AgentProfileVectorService } from './agent-profile-vector.service';

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
  categoriesNormalized?: string[];
  categoriesRaw?: string[];
  unknownTags?: string[];
  classification?: Record<string, unknown>;
  sourceVariants?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  schemaVersion?: string;
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

  private normalizeObject(input: unknown): Record<string, unknown> | null {
    if (!input || Array.isArray(input) || typeof input !== 'object') return null;
    return input as Record<string, unknown>;
  }

  private normalizeClassification(input: unknown) {
    const obj = this.normalizeObject(input);
    if (!obj) return null;
    const complexity = typeof obj.complexity === 'string' ? obj.complexity : null;
    const riskTier = typeof obj.riskTier === 'string' ? obj.riskTier : null;
    return {
      domain: this.normalizeArray(obj.domain),
      workflowStage: this.normalizeArray(obj.workflowStage),
      complexity,
      riskTier,
    };
  }

  private normalizeSourceVariants(input: unknown) {
    if (!Array.isArray(input)) return [];
    return input
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const obj = item as Record<string, unknown>;
        const sourceId = typeof obj.sourceId === 'string' ? obj.sourceId : null;
        const sourceFile = typeof obj.sourceFile === 'string' ? obj.sourceFile : null;
        const name = typeof obj.name === 'string' ? obj.name : null;
        if (!sourceId && !sourceFile) return null;
        return {
          ...(sourceId ? { sourceId } : {}),
          ...(sourceFile ? { sourceFile } : {}),
          ...(name ? { name } : {}),
        };
      })
      .filter((item): item is Record<string, string> => Boolean(item));
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
      warnings: [] as { id: string; warning: string }[],
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
      const schemaVersion = typeof entry.schemaVersion === 'string' ? entry.schemaVersion : null;
      const categoriesNormalized = this.normalizeArray(entry.categoriesNormalized);
      const categoriesRaw = this.normalizeArray(entry.categoriesRaw);
      const unknownTags = this.normalizeArray(entry.unknownTags);
      const classification = this.normalizeClassification(entry.classification);
      const sourceVariants = this.normalizeSourceVariants(entry.sourceVariants);
      const entryMetadata = this.normalizeObject(entry.metadata);

      const metadata = {
        ...(entryMetadata || {}),
        sourceFile,
        tools: this.normalizeArray(entry.tools || []),
        inferredTools: this.normalizeArray(entry.inferredTools || []),
        status: entry.status || null,
        categoriesNormalized,
        categoriesRaw,
        unknownTags,
        classification,
        sourceVariants,
        tnfRegistry: {
          schemaVersion,
          sourceFile,
          status: entry.status || null,
          categoriesNormalized,
          categoriesRaw,
          unknownTags,
          classification,
          sourceVariants,
          personaSource: personaSource || null,
        },
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
        const message = error?.message || String(error);
        result.warnings.push({ id: 'vector-reindex', warning: message });
        this.logger.warn(`Vector reindex failed after snapshot import: ${message}`);
      }
    }

    return result;
  }
}
