import { Injectable, Logger } from '@nestjs/common';
import { db } from '@the-new-fuse/database';
import axios from 'axios';
import { sql } from 'drizzle-orm';
import { TraitScreenRequestDto } from '../dto/trait-screen.dto';

type AgentProfileRow = {
  tnf_id: string;
  name: string;
  description: string | null;
  system_prompt: string | null;
  persona_source: string | null;
  definition_source: string | null;
  definition_format: string | null;
  agent_type: string;
  access_level: string;
  is_system: boolean;
  skills: unknown;
  capabilities: unknown;
  tags: unknown;
  mcp_ids: unknown;
  version: string | null;
  metadata: unknown;
};

type ProfileChunk = {
  id: string;
  chunkType: 'summary' | 'capabilities' | 'metadata' | 'prompt';
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
};

type EmbeddingProviderName = 'openai' | 'openrouter' | 'gemini';

type EmbeddingProviderConfig = {
  name: EmbeddingProviderName;
  apiKey: string;
  baseUrl: string;
  models: string[];
  supportsDimensions: boolean;
};

@Injectable()
export class AgentProfileVectorService {
  private readonly logger = new Logger(AgentProfileVectorService.name);

  private readonly collectionName = this.sanitizeIdentifier(
    process.env.AGENT_PROFILE_VECTOR_COLLECTION || 'tnf_agent_profile_vectors'
  );
  private readonly embeddingModel =
    process.env.AGENT_PROFILE_EMBEDDING_MODEL || 'text-embedding-3-small';
  private readonly embeddingDimension = Number(
    process.env.AGENT_PROFILE_EMBEDDING_DIMENSION || this.getDefaultDimension(this.embeddingModel)
  );

  // Provider and model fallback controls (adaptive, additive-safe).
  // AGENT_PROFILE_EMBEDDING_PROVIDER_PRIORITY example: "openrouter,openai,gemini"
  private readonly providerPriority = this.normalizeProviderPriority(
    process.env.AGENT_PROFILE_EMBEDDING_PROVIDER_PRIORITY || 'openai,openrouter,gemini'
  );
  // AGENT_PROFILE_EMBEDDING_MODEL_FALLBACKS example: "text-embedding-3-small,text-embedding-ada-002"
  private readonly embeddingModelFallbacks = this.parseCsv(
    process.env.AGENT_PROFILE_EMBEDDING_MODEL_FALLBACKS || ''
  );

  private readonly openAiBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1')
    .replace(/\/+$/, '')
    .trim();
  private readonly openAiApiKey =
    process.env.OPENAI_API_KEY || process.env.OPENAI_CODEX_ACCESS_TOKEN || '';
  private readonly openRouterBaseUrl = (
    process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  )
    .replace(/\/+$/, '')
    .trim();
  private readonly openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
  private readonly openRouterReferrer =
    process.env.OPENROUTER_HTTP_REFERER || 'https://thenewfuse.com';
  private readonly openRouterTitle = process.env.OPENROUTER_X_TITLE || 'The New Fuse';
  private readonly geminiBaseUrl = (
    process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'
  )
    .replace(/\/+$/, '')
    .trim();
  private readonly geminiApiKey = process.env.GEMINI_API_KEY || '';
  private initialized = false;

  private rows(result: unknown): Record<string, any>[] {
    if (Array.isArray(result)) return result as Record<string, any>[];
    if ((result as any)?.rows && Array.isArray((result as any).rows)) {
      return (result as any).rows as Record<string, any>[];
    }
    return [];
  }

  private collectionSql() {
    return sql.raw(`"${this.collectionName}"`);
  }

  private sanitizeIdentifier(identifier: string): string {
    const cleaned = identifier.replace(/[^a-zA-Z0-9_]/g, '').trim();
    if (!cleaned) {
      throw new Error('Invalid vector collection name');
    }
    if (cleaned.length > 63) {
      throw new Error('Vector collection name exceeds postgres identifier length');
    }
    return cleaned;
  }

  private getDefaultDimension(model: string): number {
    const map: Record<string, number> = {
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
      'text-embedding-ada-002': 1536,
      'openai/text-embedding-3-small': 1536,
      'openai/text-embedding-3-large': 3072,
      'openai/text-embedding-ada-002': 1536,
      'text-embedding-004': 768,
      'models/text-embedding-004': 768,
    };
    return map[model] || 1536;
  }

  private parseCsv(input: string): string[] {
    return input
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private normalizeProviderPriority(input: string): EmbeddingProviderName[] {
    const allowed = new Set<EmbeddingProviderName>(['openai', 'openrouter', 'gemini']);
    const ordered = this.parseCsv(input)
      .map((value) => value.toLowerCase())
      .filter((value): value is EmbeddingProviderName =>
        allowed.has(value as EmbeddingProviderName)
      );

    const fallbackOrder: EmbeddingProviderName[] = ['openai', 'openrouter', 'gemini'];
    const result = [...ordered, ...fallbackOrder];
    return Array.from(new Set(result));
  }

  private getProviderModel(provider: EmbeddingProviderName): string {
    if (provider === 'openrouter') {
      return (
        process.env.AGENT_PROFILE_OPENROUTER_EMBEDDING_MODEL ||
        process.env.OPENROUTER_EMBEDDING_MODEL ||
        `openai/${this.embeddingModel}`
      );
    }
    if (provider === 'gemini') {
      return process.env.AGENT_PROFILE_GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
    }
    return process.env.AGENT_PROFILE_OPENAI_EMBEDDING_MODEL || this.embeddingModel;
  }

  private getProviderModelFallbacks(provider: EmbeddingProviderName): string[] {
    if (provider === 'openrouter') {
      return this.parseCsv(process.env.AGENT_PROFILE_OPENROUTER_EMBEDDING_MODEL_FALLBACKS || '');
    }
    if (provider === 'gemini') {
      return this.parseCsv(process.env.AGENT_PROFILE_GEMINI_EMBEDDING_MODEL_FALLBACKS || '');
    }
    return this.parseCsv(process.env.AGENT_PROFILE_OPENAI_EMBEDDING_MODEL_FALLBACKS || '');
  }

  private normalizeModelForProvider(model: string, provider: EmbeddingProviderName): string {
    const trimmed = model.trim();
    if (!trimmed) return '';

    if (provider === 'openai' && trimmed.startsWith('openai/')) {
      return trimmed.replace(/^openai\//, '');
    }
    if (provider === 'openrouter' && !trimmed.includes('/')) {
      return `openai/${trimmed}`;
    }
    if (provider === 'gemini') {
      return trimmed.replace(/^models\//, '');
    }
    return trimmed;
  }

  private buildModelCandidates(provider: EmbeddingProviderName): string[] {
    const primary = this.normalizeModelForProvider(this.getProviderModel(provider), provider);
    const providerFallbacks = this.getProviderModelFallbacks(provider).map((value) =>
      this.normalizeModelForProvider(value, provider)
    );
    const globalFallbacks = this.embeddingModelFallbacks.map((value) =>
      this.normalizeModelForProvider(value, provider)
    );

    const merged = [primary, ...providerFallbacks, ...globalFallbacks].filter(Boolean);

    if (provider !== 'openrouter') {
      return Array.from(new Set(merged));
    }

    const expanded = merged.flatMap((model) =>
      model.startsWith('openai/') ? [model, model.replace(/^openai\//, '')] : [model]
    );
    return Array.from(new Set(expanded));
  }

  private resolveEmbeddingProviders(): EmbeddingProviderConfig[] {
    const resolved: EmbeddingProviderConfig[] = [];

    for (const provider of this.providerPriority) {
      const models = this.buildModelCandidates(provider);
      if (models.length === 0) continue;

      if (provider === 'openai' && this.openAiApiKey) {
        resolved.push({
          name: 'openai',
          apiKey: this.openAiApiKey,
          baseUrl: this.openAiBaseUrl,
          models,
          supportsDimensions: true,
        });
      }

      if (provider === 'openrouter' && this.openRouterApiKey) {
        resolved.push({
          name: 'openrouter',
          apiKey: this.openRouterApiKey,
          baseUrl: this.openRouterBaseUrl,
          models,
          supportsDimensions: true,
        });
      }

      if (provider === 'gemini' && this.geminiApiKey) {
        resolved.push({
          name: 'gemini',
          apiKey: this.geminiApiKey,
          baseUrl: this.geminiBaseUrl,
          models,
          supportsDimensions: true,
        });
      }
    }

    return resolved;
  }

  private normalizeStringArray(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    return input.map((v) => String(v).trim()).filter(Boolean);
  }

  private splitText(text: string, maxLen = 2200): string[] {
    const normalized = text.trim();
    if (!normalized) return [];
    if (normalized.length <= maxLen) return [normalized];

    const chunks: string[] = [];
    let start = 0;
    while (start < normalized.length) {
      const end = Math.min(start + maxLen, normalized.length);
      const slice = normalized.slice(start, end);
      if (slice.trim()) chunks.push(slice.trim());
      start = end;
    }
    return chunks;
  }

  private toVectorLiteral(embedding: number[]): string {
    const values = embedding.map((value) => {
      if (!Number.isFinite(value)) return '0';
      return Number(value).toString();
    });
    return `[${values.join(',')}]`;
  }

  private errorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const payload =
        typeof error.response?.data === 'string'
          ? error.response?.data
          : JSON.stringify(error.response?.data || {});
      return status ? `status_${status}: ${payload}` : payload || error.message;
    }
    return error instanceof Error ? error.message : String(error);
  }

  private isLikelyModelOrDimensionError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    if (!status || ![400, 404, 422].includes(status)) return false;
    const payload =
      typeof error.response?.data === 'string'
        ? error.response?.data
        : JSON.stringify(error.response?.data || {});
    const lower = payload.toLowerCase();
    return (
      lower.includes('model') ||
      lower.includes('embedding') ||
      lower.includes('dimension') ||
      lower.includes('unsupported') ||
      lower.includes('not found')
    );
  }

  private shouldRetryWithoutDimensions(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    if (!status || ![400, 422].includes(status)) return false;
    const payload =
      typeof error.response?.data === 'string'
        ? error.response?.data
        : JSON.stringify(error.response?.data || {});
    const lower = payload.toLowerCase();
    return lower.includes('dimension') || lower.includes('dimensions');
  }

  private async openAiCompatibleEmbeddings(
    provider: EmbeddingProviderConfig,
    model: string,
    texts: string[]
  ): Promise<number[][]> {
    const batchSize = 96;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const requestBody: Record<string, unknown> = {
        model,
        input: batch,
      };

      if (provider.supportsDimensions && this.embeddingDimension > 0) {
        requestBody.dimensions = this.embeddingDimension;
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      };
      if (provider.name === 'openrouter') {
        headers['HTTP-Referer'] = this.openRouterReferrer;
        headers['X-Title'] = this.openRouterTitle;
      }

      const endpoint = `${provider.baseUrl}/embeddings`;
      const runRequest = async (body: Record<string, unknown>) =>
        axios.post(endpoint, body, { headers, timeout: 60_000 });

      let response;
      try {
        response = await runRequest(requestBody);
      } catch (error) {
        if (requestBody.dimensions && this.shouldRetryWithoutDimensions(error)) {
          const fallbackBody = { ...requestBody };
          delete fallbackBody.dimensions;
          response = await runRequest(fallbackBody);
        } else {
          throw error;
        }
      }

      const items = Array.isArray(response.data?.data) ? response.data.data : [];
      if (items.length !== batch.length) {
        throw new Error(
          `Embedding provider returned ${items.length} embeddings for ${batch.length} inputs`
        );
      }

      allEmbeddings.push(
        ...items.map((item: any) => {
          if (!Array.isArray(item.embedding)) {
            throw new Error('Embedding payload missing embedding vector');
          }
          return item.embedding as number[];
        })
      );
    }

    return allEmbeddings;
  }

  private toGeminiModelPath(model: string): string {
    const normalized = model.replace(/^models\//, '').trim();
    return `models/${normalized}`;
  }

  private async geminiEmbeddings(
    provider: EmbeddingProviderConfig,
    model: string,
    texts: string[]
  ): Promise<number[][]> {
    const batchSize = 64;
    const allEmbeddings: number[][] = [];
    const modelPath = this.toGeminiModelPath(model);

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const buildRequests = (includeDimensions: boolean) =>
        batch.map((text) => ({
          model: modelPath,
          content: { parts: [{ text }] },
          taskType: 'RETRIEVAL_DOCUMENT',
          ...(includeDimensions && provider.supportsDimensions && this.embeddingDimension > 0
            ? { outputDimensionality: this.embeddingDimension }
            : {}),
        }));

      const endpoint = `${provider.baseUrl}/${modelPath}:batchEmbedContents?key=${encodeURIComponent(provider.apiKey)}`;
      const runRequest = (includeDimensions: boolean) =>
        axios.post(
          endpoint,
          { requests: buildRequests(includeDimensions) },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 60_000,
          }
        );

      let response;
      try {
        response = await runRequest(true);
      } catch (error) {
        if (this.shouldRetryWithoutDimensions(error)) {
          response = await runRequest(false);
        } else {
          throw error;
        }
      }

      const items = Array.isArray(response.data?.embeddings) ? response.data.embeddings : [];
      if (items.length !== batch.length) {
        throw new Error(
          `Gemini embedding provider returned ${items.length} embeddings for ${batch.length} inputs`
        );
      }

      allEmbeddings.push(
        ...items.map((item: any) => {
          const values = Array.isArray(item?.values)
            ? item.values
            : Array.isArray(item?.embedding?.values)
              ? item.embedding.values
              : null;
          if (!values) {
            throw new Error('Gemini embedding payload missing values');
          }
          return values as number[];
        })
      );
    }

    return allEmbeddings;
  }

  private async generateByProvider(
    provider: EmbeddingProviderConfig,
    texts: string[]
  ): Promise<number[][]> {
    const modelErrors: string[] = [];

    for (const model of provider.models) {
      try {
        if (provider.name === 'gemini') {
          return await this.geminiEmbeddings(provider, model, texts);
        }
        return await this.openAiCompatibleEmbeddings(provider, model, texts);
      } catch (error) {
        const message = this.errorMessage(error);
        modelErrors.push(`${model}: ${message}`);
        this.logger.warn(
          `Embedding model attempt failed provider=${provider.name} model=${model}: ${message}`
        );

        if (!this.isLikelyModelOrDimensionError(error)) {
          break;
        }
      }
    }

    throw new Error(
      `No usable embedding model for provider ${provider.name}. Attempts: ${modelErrors.join(' | ')}`
    );
  }

  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts.length) {
      return [];
    }

    const providers = this.resolveEmbeddingProviders();
    if (providers.length === 0) {
      throw new Error(
        'No embedding provider key configured. Set one of OPENAI_API_KEY/OPENAI_CODEX_ACCESS_TOKEN, OPENROUTER_API_KEY, or GEMINI_API_KEY.'
      );
    }

    const providerErrors: string[] = [];
    for (const provider of providers) {
      try {
        return await this.generateByProvider(provider, texts);
      } catch (error) {
        const message = this.errorMessage(error);
        providerErrors.push(`${provider.name}: ${message}`);
        this.logger.warn(`Embedding provider failed provider=${provider.name}: ${message}`);
      }
    }

    throw new Error(`All embedding providers failed: ${providerErrors.join(' || ')}`);
  }

  private async ensureVectorStore(): Promise<void> {
    if (this.initialized) return;

    const vectorIndexName = this.sanitizeIdentifier(`${this.collectionName}_embedding_idx`);
    const metadataIndexName = this.sanitizeIdentifier(`${this.collectionName}_metadata_idx`);
    const agentIndexName = this.sanitizeIdentifier(`${this.collectionName}_agent_idx`);

    await db.execute(sql.raw('CREATE EXTENSION IF NOT EXISTS vector'));
    await db.execute(
      sql.raw(`
        CREATE TABLE IF NOT EXISTS "${this.collectionName}" (
          id TEXT PRIMARY KEY,
          agent_tnf_id TEXT NOT NULL,
          chunk_type VARCHAR(40) NOT NULL,
          chunk_index INTEGER NOT NULL DEFAULT 0,
          content TEXT NOT NULL,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          embedding vector(${this.embeddingDimension}) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
    );

    await db.execute(
      sql.raw(`
        CREATE INDEX IF NOT EXISTS "${agentIndexName}"
        ON "${this.collectionName}" (agent_tnf_id)
      `)
    );
    await db.execute(
      sql.raw(`
        CREATE INDEX IF NOT EXISTS "${metadataIndexName}"
        ON "${this.collectionName}" USING GIN (metadata)
      `)
    );
    await db.execute(
      sql.raw(`
        CREATE INDEX IF NOT EXISTS "${vectorIndexName}"
        ON "${this.collectionName}"
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `)
    );

    this.initialized = true;
  }

  private async fetchAllAgentRows(): Promise<AgentProfileRow[]> {
    const result = await db.execute(sql`
      SELECT
        d.tnf_id,
        d.name,
        d.description,
        d.system_prompt,
        d.persona_source,
        d.definition_source,
        d.definition_format,
        d.agent_type,
        d.access_level,
        d.is_system,
        d.skills,
        d.capabilities,
        d.tags,
        d.mcp_ids,
        d.version,
        d.metadata
      FROM tnf_agent_definitions d
      ORDER BY d.is_system DESC, d.name ASC
    `);
    return this.rows(result) as AgentProfileRow[];
  }

  private async fetchAgentRow(tnfId: string): Promise<AgentProfileRow | null> {
    const result = await db.execute(sql`
      SELECT
        d.tnf_id,
        d.name,
        d.description,
        d.system_prompt,
        d.persona_source,
        d.definition_source,
        d.definition_format,
        d.agent_type,
        d.access_level,
        d.is_system,
        d.skills,
        d.capabilities,
        d.tags,
        d.mcp_ids,
        d.version,
        d.metadata
      FROM tnf_agent_definitions d
      WHERE d.tnf_id = ${tnfId}
      LIMIT 1
    `);
    const rows = this.rows(result);
    return (rows[0] as AgentProfileRow) || null;
  }

  private buildProfileChunks(row: AgentProfileRow): ProfileChunk[] {
    const skills = this.normalizeStringArray(row.skills);
    const capabilities = this.normalizeStringArray(row.capabilities);
    const tags = this.normalizeStringArray(row.tags);
    const mcpIds = this.normalizeStringArray(row.mcp_ids);
    const metadataValue =
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : {};

    const summary = [
      `Agent TNF ID: ${row.tnf_id}`,
      `Name: ${row.name}`,
      `Description: ${row.description || 'No description provided'}`,
      `Agent Type: ${row.agent_type}`,
      `Access Level: ${row.access_level}`,
      `System Agent: ${row.is_system ? 'yes' : 'no'}`,
      `Definition Source: ${row.definition_source || 'unknown'}`,
      `Definition Format: ${row.definition_format || 'unknown'}`,
      `Persona Source: ${row.persona_source || 'none'}`,
      `Version: ${row.version || 'unknown'}`,
      `Capabilities: ${capabilities.join(', ') || 'none'}`,
      `Skills: ${skills.join(', ') || 'none'}`,
      `Tags: ${tags.join(', ') || 'none'}`,
      `MCP IDs: ${mcpIds.join(', ') || 'none'}`,
    ].join('\n');

    const capabilitiesChunk = [
      `Capability profile for ${row.name} (${row.tnf_id})`,
      `Capabilities: ${capabilities.join(', ') || 'none'}`,
      `Skills: ${skills.join(', ') || 'none'}`,
      `Tags: ${tags.join(', ') || 'none'}`,
      `MCP integrations: ${mcpIds.join(', ') || 'none'}`,
      `Agent type: ${row.agent_type}`,
      `Access level: ${row.access_level}`,
    ].join('\n');

    const chunks: ProfileChunk[] = [
      {
        id: `${row.tnf_id}::summary::0`,
        chunkType: 'summary',
        chunkIndex: 0,
        content: summary,
        metadata: {
          agentTnfId: row.tnf_id,
          agentName: row.name,
          chunkType: 'summary',
          agentType: row.agent_type,
          accessLevel: row.access_level,
          isSystem: row.is_system,
          skills,
          capabilities,
          tags,
          mcpIds,
        },
      },
      {
        id: `${row.tnf_id}::capabilities::0`,
        chunkType: 'capabilities',
        chunkIndex: 0,
        content: capabilitiesChunk,
        metadata: {
          agentTnfId: row.tnf_id,
          agentName: row.name,
          chunkType: 'capabilities',
          skills,
          capabilities,
          tags,
        },
      },
    ];

    if (Object.keys(metadataValue).length > 0) {
      chunks.push({
        id: `${row.tnf_id}::metadata::0`,
        chunkType: 'metadata',
        chunkIndex: 0,
        content: `Metadata for ${row.name} (${row.tnf_id}):\n${JSON.stringify(metadataValue, null, 2)}`,
        metadata: {
          agentTnfId: row.tnf_id,
          agentName: row.name,
          chunkType: 'metadata',
        },
      });
    }

    const prompt = (row.system_prompt || '').trim();
    const promptChunks = this.splitText(prompt, 2200);
    for (let i = 0; i < promptChunks.length; i += 1) {
      chunks.push({
        id: `${row.tnf_id}::prompt::${i}`,
        chunkType: 'prompt',
        chunkIndex: i,
        content: `System prompt section ${i + 1} for ${row.name} (${row.tnf_id}):\n${promptChunks[i]}`,
        metadata: {
          agentTnfId: row.tnf_id,
          agentName: row.name,
          chunkType: 'prompt',
          section: i,
        },
      });
    }

    return chunks.filter((chunk) => chunk.content.trim().length > 0);
  }

  private async upsertAgentChunks(row: AgentProfileRow): Promise<number> {
    const chunks = this.buildProfileChunks(row);
    if (chunks.length === 0) return 0;

    const embeddings = await this.generateEmbeddings(chunks.map((chunk) => chunk.content));

    await db.execute(sql`DELETE FROM ${this.collectionSql()} WHERE agent_tnf_id = ${row.tnf_id}`);

    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const vectorLiteral = this.toVectorLiteral(embedding);

      await db.execute(sql`
        INSERT INTO ${this.collectionSql()} (
          id,
          agent_tnf_id,
          chunk_type,
          chunk_index,
          content,
          metadata,
          embedding
        )
        VALUES (
          ${chunk.id},
          ${row.tnf_id},
          ${chunk.chunkType},
          ${chunk.chunkIndex},
          ${chunk.content},
          ${chunk.metadata},
          ${sql.raw(`'${vectorLiteral}'::vector`)}
        )
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
      `);
    }

    return chunks.length;
  }

  async reindexAllAgentProfiles() {
    await this.ensureVectorStore();
    const rows = await this.fetchAllAgentRows();
    const summary = {
      ok: true,
      totalAgents: rows.length,
      indexedAgents: 0,
      totalChunks: 0,
      skippedAgents: 0,
      errors: [] as { agentTnfId: string; error: string }[],
    };

    for (const row of rows) {
      if (!row?.tnf_id) {
        summary.skippedAgents += 1;
        continue;
      }

      try {
        const chunkCount = await this.upsertAgentChunks(row);
        summary.indexedAgents += 1;
        summary.totalChunks += chunkCount;
      } catch (error: any) {
        summary.ok = false;
        summary.errors.push({
          agentTnfId: row.tnf_id,
          error: error?.message || String(error),
        });
        this.logger.error(
          `Failed to reindex vector profile for ${row.tnf_id}: ${error?.message || error}`
        );
      }
    }

    return summary;
  }

  async reindexByTnfIds(tnfIds: string[]) {
    await this.ensureVectorStore();
    const uniqueIds = Array.from(new Set(tnfIds.map((id) => String(id).trim()).filter(Boolean)));
    const summary = {
      ok: true,
      requested: uniqueIds.length,
      indexedAgents: 0,
      totalChunks: 0,
      missing: [] as string[],
      errors: [] as { agentTnfId: string; error: string }[],
    };

    for (const tnfId of uniqueIds) {
      const row = await this.fetchAgentRow(tnfId);
      if (!row) {
        summary.missing.push(tnfId);
        continue;
      }

      try {
        const chunkCount = await this.upsertAgentChunks(row);
        summary.indexedAgents += 1;
        summary.totalChunks += chunkCount;
      } catch (error: any) {
        summary.ok = false;
        summary.errors.push({ agentTnfId: tnfId, error: error?.message || String(error) });
      }
    }

    return summary;
  }

  async screenInquiry(request: TraitScreenRequestDto) {
    await this.ensureVectorStore();
    const limit = Math.max(1, Math.min(25, Number(request.limit || 5)));
    const threshold = Math.max(0, Math.min(1, Number(request.threshold ?? 0.45)));
    const onlySystem = Boolean(request.onlySystem);
    const includeChunks = request.includeChunks !== false;
    const accessFilter = new Set(
      (request.includeAccessLevels || []).map((value) => value.toLowerCase()).filter(Boolean)
    );

    const [queryEmbedding] = await this.generateEmbeddings([request.inquiry]);
    const vectorLiteral = this.toVectorLiteral(queryEmbedding);
    const fetchLimit = Math.max(20, limit * 10);

    const result = await db.execute(
      sql.raw(`
        SELECT
          v.agent_tnf_id,
          v.chunk_type,
          v.chunk_index,
          v.content,
          v.metadata,
          1 - (v.embedding <=> '${vectorLiteral}'::vector) AS score,
          d.name,
          d.description,
          d.agent_type,
          d.access_level,
          d.is_system,
          d.skills,
          d.capabilities,
          d.tags,
          d.mcp_ids
        FROM "${this.collectionName}" v
        INNER JOIN tnf_agent_definitions d ON d.tnf_id = v.agent_tnf_id
        ORDER BY v.embedding <=> '${vectorLiteral}'::vector
        LIMIT ${fetchLimit}
      `)
    );

    const matches = this.rows(result);
    const candidates = new Map<
      string,
      {
        agentTnfId: string;
        name: string;
        description: string | null;
        score: number;
        agentType: string;
        accessLevel: string;
        isSystem: boolean;
        skills: string[];
        capabilities: string[];
        tags: string[];
        mcpIds: string[];
        matchedChunks: Array<{ type: string; index: number; score: number; content: string }>;
      }
    >();

    for (const row of matches) {
      const score = Number(row.score);
      if (!Number.isFinite(score) || score < threshold) continue;

      const accessLevel = String(row.access_level || '').toLowerCase();
      const isSystem = Boolean(row.is_system);

      if (onlySystem && !isSystem) continue;
      if (accessFilter.size > 0 && !accessFilter.has(accessLevel)) continue;

      const key = String(row.agent_tnf_id);
      if (!candidates.has(key)) {
        candidates.set(key, {
          agentTnfId: key,
          name: String(row.name || key),
          description: row.description ? String(row.description) : null,
          score,
          agentType: String(row.agent_type || 'GENERIC'),
          accessLevel,
          isSystem,
          skills: this.normalizeStringArray(row.skills),
          capabilities: this.normalizeStringArray(row.capabilities),
          tags: this.normalizeStringArray(row.tags),
          mcpIds: this.normalizeStringArray(row.mcp_ids),
          matchedChunks: [],
        });
      }

      const current = candidates.get(key)!;
      if (score > current.score) current.score = score;

      if (includeChunks && current.matchedChunks.length < 4) {
        current.matchedChunks.push({
          type: String(row.chunk_type || 'unknown'),
          index: Number(row.chunk_index || 0),
          score,
          content: String(row.content || '').slice(0, 600),
        });
      }
    }

    const ranked = Array.from(candidates.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const topScore = ranked[0]?.score || 0;
    const confidence = topScore >= 0.78 ? 'high' : topScore >= 0.62 ? 'medium' : 'low';

    const traitFilters = Array.from(
      new Set(
        ranked.flatMap((candidate) => [
          ...candidate.capabilities,
          ...candidate.skills,
          ...candidate.tags,
        ])
      )
    ).slice(0, 30);

    return {
      inquiry: request.inquiry,
      config: {
        collection: this.collectionName,
        embeddingModel: this.embeddingModel,
        embeddingDimension: this.embeddingDimension,
        limit,
        threshold,
      },
      candidates: ranked.map((candidate) => ({
        ...candidate,
        score: Number(candidate.score.toFixed(6)),
      })),
      resourceQueryPlan: {
        requiredAgentIds: ranked.map((candidate) => candidate.agentTnfId),
        traitFilters,
        confidence,
        fallbackToBroadSearch: ranked.length === 0 || confidence === 'low',
      },
    };
  }

  async getStats() {
    await this.ensureVectorStore();

    const [countResult, updatedResult] = await Promise.all([
      db.execute(
        sql.raw(
          `SELECT count(*)::int AS total, count(DISTINCT agent_tnf_id)::int AS agents FROM "${this.collectionName}"`
        )
      ),
      db.execute(
        sql.raw(`SELECT max(updated_at) AS last_updated_at FROM "${this.collectionName}"`)
      ),
    ]);

    const countRows = this.rows(countResult);
    const updatedRows = this.rows(updatedResult);

    return {
      collection: this.collectionName,
      embeddingModel: this.embeddingModel,
      embeddingDimension: this.embeddingDimension,
      totalVectors: Number(countRows[0]?.total || 0),
      indexedAgents: Number(countRows[0]?.agents || 0),
      lastUpdatedAt: updatedRows[0]?.last_updated_at || null,
    };
  }
}
