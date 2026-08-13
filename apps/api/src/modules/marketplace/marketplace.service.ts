import { BadRequestException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { drizzleMarketplaceCatalogRepository } from '@the-new-fuse/database';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import postgres, { Sql } from 'postgres';
import {
  MarketplaceCatalogItem,
  MarketplaceCatalogQuery,
  MarketplaceCatalogSubmissionInput,
  MarketplaceExperienceSubmissionInput,
  MarketplaceKind,
  MarketplacePublicationStatus,
} from './marketplace.types';

const NOW = new Date().toISOString();
const MAX_TEXT_LENGTH = 400;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_TAGS = 12;
const MAX_CAPABILITIES = 16;

type MarketplaceResearchCounts = {
  categories: number;
  sources: number;
  sourceLinks: number;
  prompts: number;
  artifacts: number;
};

type MarketplaceResearchSkillCounts = {
  categories: number;
  sources: number;
  sourceLinks: number;
  files: number;
};

type MarketplaceResearchSkillMarketplaceCounts = {
  entries: number;
};

type MarketplaceResearchMcpCounts = {
  categories: number;
  sources: number;
  links: number;
  servers: number;
};

type MarketplaceResearchPromptRow = {
  id: number;
  sourceId: number;
  title: string | null;
  promptText: string;
  url: string | null;
  license: string | null;
  tags: string | null;
  createdAt: string | null;
};

type MarketplaceResearchSourceRow = {
  categoryId: number;
  categoryName: string;
  sourceId: number;
  sourceName: string;
  sourceUrl: string;
  sourceBrief: string | null;
};

type MarketplaceResearchSkillSourceRow = {
  categoryId: number;
  categoryName: string;
  sourceId: number;
  sourceName: string;
  sourceUrl: string;
  sourceBrief: string | null;
};

type MarketplaceResearchSkillFileRow = {
  id: number;
  sourceId: number;
  sourceName: string | null;
  categoryName: string | null;
  repoUrl: string | null;
  fileUrl: string;
  filePath: string | null;
  title: string | null;
  content: string;
  license: string | null;
  tags: string | null;
  createdAt: string | null;
};

type MarketplaceResearchSkillMarketplaceEntryRow = {
  id: number;
  source: string;
  entryUrl: string;
  title: string | null;
  brief: string | null;
  tags: string | null;
  discoveredAt: string | null;
};

type MarketplaceResearchMcpSourceRow = {
  categoryId: number;
  categoryName: string;
  sourceId: number;
  sourceName: string;
  sourceUrl: string;
  sourceBrief: string | null;
};

type MarketplaceResearchMcpServerRow = {
  id: number;
  sourceId: number | null;
  serverName: string;
  serverUrl: string | null;
  repoUrl: string | null;
  description: string | null;
  tags: string | null;
  maintainer: string | null;
  stars: number | null;
  license: string | null;
  transport: string | null;
  createdAt: string | null;
};

type MarketplaceCrawlRunRow = {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  stats: Record<string, unknown> | null;
  error: string | null;
};

@Injectable()
export class MarketplaceService implements OnModuleInit, OnModuleDestroy {
  private initialized = false;
  private dbEnabled = true;
  private dbClient: Sql | null = null;
  private readonly activeResearchRuns = new Set<string>();
  private readonly researchRunStartedAt = new Map<string, string>();

  private readonly seedItems: MarketplaceCatalogItem[] = [
    {
      id: 'prim-native-vision-simd',
      slug: 'native-vision-simd',
      name: 'SIMD Vision Module',
      description:
        'High-fidelity Tier-1 native vision capture/encode (MSS + TurboJPEG), achieving 34 FPS mirroring.',
      kind: 'skill',
      category: 'sensory',
      tags: ['vision', 'simd', 'hardware'],
      capabilities: ['native_capture', 'jpeg_turbo_encode', 'fps_acceleration'],
      rating: 5.0,
      totalRuns: 14200,
      successRate: 99.8,
      pricePerRun: 0,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'prim-jit-forge-llvm',
      slug: 'jit-forge-llvm',
      name: 'LLVM JIT Forge',
      description:
        'Hot-swappable native machine code (C/C++/Rust) compiler for 100x agent speedups.',
      kind: 'workflow',
      category: 'forge',
      tags: ['llvm', 'jit', 'native'],
      capabilities: ['native_compilation', 'hot_swapping', 'perf_boost'],
      rating: 4.9,
      totalRuns: 8900,
      successRate: 99.1,
      pricePerRun: 0.05,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'prim-rust-synaptic-bus',
      slug: 'rust-synaptic-bus',
      name: 'Synaptic Bus V1',
      description:
        'High-performance Rust-based broadcast loops achieving ~49,000 msg/s throughput.',
      kind: 'mcp_server',
      category: 'nexus',
      tags: ['rust', 'networking', 'telemetry'],
      capabilities: ['high_throughput', 'zero_copy_relay', 'bus_orchestration'],
      rating: 4.8,
      totalRuns: 52100,
      successRate: 99.9,
      pricePerRun: 0,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'prim-ir-safety-inspector',
      slug: 'ir-safety-inspector',
      name: 'IR Safety Gatekeeper',
      description:
        'Zero-trust gatekeeper for native code generation with heuristic syscall detection.',
      kind: 'skill',
      category: 'security',
      tags: ['llvm-ir', 'security', 'audit'],
      capabilities: ['syscall_detection', 'ir_verification', 'sandbox_policy'],
      rating: 4.7,
      totalRuns: 12400,
      successRate: 98.4,
      pricePerRun: 0.02,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'prim-dola-seed-2-pro',
      slug: 'dola-seed-2-pro',
      name: 'Dola-Seed-2.0-Pro',
      description:
        'High-fidelity backbone model for complex hardware-intimate agent logic and native forge control.',
      kind: 'model',
      category: 'intelligence',
      tags: ['llm', 'reasoning', 'backbone'],
      capabilities: ['complex_reasoning', 'forge_control', 'low_latency'],
      rating: 5.0,
      totalRuns: 325000,
      successRate: 99.2,
      pricePerRun: 0,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'kilocode',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'prim-vector-avx2-accel',
      slug: 'vector-avx2-accel',
      name: 'Vector AVX2 Core',
      description:
        'SIMD-optimized vector similarity using C++ AVX2 achieving ~610 Million dims/sec.',
      kind: 'skill',
      category: 'analytics',
      tags: ['cpp', 'avx2', 'simd'],
      capabilities: ['vector_similarity', 'dims_acceleration', 'memory_locality'],
      rating: 4.9,
      totalRuns: 7600,
      successRate: 99.7,
      pricePerRun: 0.01,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'prim-spectral-audio-match',
      slug: 'spectral-audio-match',
      name: 'Spectral Audio Match',
      description:
        'Sub-millisecond acoustic signature detection module forged for the native kernel.',
      kind: 'skill',
      category: 'sensory',
      tags: ['audio', 'vdsp', 'hardware'],
      capabilities: ['acoustic_signature', 'vdsp_acceleration', 'trigger_loops'],
      rating: 4.8,
      totalRuns: 15400,
      successRate: 98.9,
      pricePerRun: 0,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'prim-macos-sandbox-exec',
      slug: 'macos-sandbox-exec',
      name: 'Sandbox-Exec Isolated',
      description:
        'Secure isolation primitive for forged binaries using native macOS sandbox-exec rules.',
      kind: 'workflow',
      category: 'security',
      tags: ['macos', 'sandbox', 'isolation'],
      capabilities: ['binary_isolation', 'resource_gating', 'entitlement_check'],
      rating: 4.6,
      totalRuns: 4330,
      successRate: 99.5,
      pricePerRun: 0.04,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  constructor() {}

  async onModuleInit(): Promise<void> {
    await this.ensureInitialized();
    await this.syncSeedItems();
  }

  private async syncSeedItems(): Promise<void> {
    if (!this.dbEnabled || !this.dbClient) return;
    try {
      for (const item of this.seedItems) {
        await this.persistItem(item, true);
      }
    } catch (error) {
      console.error('MarketplaceService: failed to sync seed items.', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dbClient) {
      await this.dbClient.end({ timeout: 5 });
    }
  }

  async getCatalog(
    query: MarketplaceCatalogQuery
  ): Promise<{ items: MarketplaceCatalogItem[]; total: number }> {
    const kind = this.normalizeKind(query.kind);
    const status = this.normalizeStatus(query.status);
    const category = query.category?.toLowerCase();
    const q = query.q?.toLowerCase();
    const limit = this.normalizeLimit(query.limit);
    const offset = this.normalizeOffset(query.offset);

    const items = await this.getAllItems();
    const filtered = items.filter((item) => {
      if (kind && item.kind !== kind) return false;
      if (status && item.publicationStatus !== status) return false;
      if (category && item.category.toLowerCase() !== category) return false;
      if (q) {
        const haystack = [
          item.name,
          item.description,
          item.category,
          ...item.tags,
          ...item.capabilities,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return {
      items: sorted.slice(offset, offset + limit),
      total: sorted.length,
    };
  }

  async getExperiences(
    query: MarketplaceCatalogQuery
  ): Promise<{ items: MarketplaceCatalogItem[]; total: number }> {
    return this.getCatalog({
      ...query,
      kind: 'experience',
      status: query.status || 'published',
    });
  }

  async getResearchCounts(): Promise<{
    available: boolean;
    counts: MarketplaceResearchCounts;
    error?: string;
  }> {
    const empty: MarketplaceResearchCounts = {
      categories: 0,
      sources: 0,
      sourceLinks: 0,
      prompts: 0,
      artifacts: 0,
    };

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { available: false, counts: empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const [categories] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.categories`;
      const [sources] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.sources`;
      const [sourceLinks] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.source_links`;
      const [prompts] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.prompts`;
      const [artifacts] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.artifacts`;

      return {
        available: true,
        counts: {
          categories: Number(categories?.n || 0),
          sources: Number(sources?.n || 0),
          sourceLinks: Number(sourceLinks?.n || 0),
          prompts: Number(prompts?.n || 0),
          artifacts: Number(artifacts?.n || 0),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        available: false,
        counts: empty,
        error: `Research tables unavailable: ${message}`,
      };
    }
  }

  async searchResearchPrompts(input: { q?: string; limit?: number; offset?: number }): Promise<{
    items: MarketplaceResearchPromptRow[];
    total: number;
    available: boolean;
    error?: string;
  }> {
    const empty = { items: [] as MarketplaceResearchPromptRow[], total: 0, available: false };
    const q = this.sanitizeText(input.q || '', MAX_DESCRIPTION_LENGTH).toLowerCase();
    const limit = this.normalizeLimit(input.limit);
    const offset = this.normalizeOffset(input.offset);

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { ...empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const whereLike = `%${q}%`;
      const whereClause = q
        ? this.dbClient`
            WHERE lower(coalesce(title, '')) LIKE ${whereLike}
               OR lower(prompt_text) LIKE ${whereLike}
               OR lower(coalesce(tags, '')) LIKE ${whereLike}
          `
        : this.dbClient``;

      const totalRows = await this.dbClient`
        SELECT COUNT(*)::int AS n
        FROM ai_assets_marketplace.prompts
        ${whereClause}
      `;

      const rows = await this.dbClient<MarketplaceResearchPromptRow[]>`
        SELECT
          id,
          source_id AS "sourceId",
          title,
          prompt_text AS "promptText",
          url,
          license,
          tags,
          created_at AS "createdAt"
        FROM ai_assets_marketplace.prompts
        ${whereClause}
        ORDER BY id DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      return {
        available: true,
        items: this.extractRows(rows).map((row) => ({
          id: Number(row.id),
          sourceId: Number(row.sourceId),
          title: row.title ?? null,
          promptText: String(row.promptText || ''),
          url: row.url ?? null,
          license: row.license ?? null,
          tags: row.tags ?? null,
          createdAt: row.createdAt ?? null,
        })),
        total: Number(this.extractRows(totalRows)[0]?.n || 0),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ...empty, error: `Research prompt search unavailable: ${message}` };
    }
  }

  async getResearchSources(input?: { limitPerCategory?: number }): Promise<{
    available: boolean;
    categories: Array<{
      id: number;
      name: string;
      sources: Array<{
        id: number;
        name: string;
        url: string;
        brief: string | null;
      }>;
    }>;
    error?: string;
  }> {
    type ResearchSourceCategory = {
      id: number;
      name: string;
      sources: Array<{ id: number; name: string; url: string; brief: string | null }>;
    };
    const empty = { available: false, categories: [] as ResearchSourceCategory[] };
    const limitPerCategory = Math.max(1, Math.min(Number(input?.limitPerCategory) || 8, 20));

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { ...empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const rows = await this.dbClient<MarketplaceResearchSourceRow[]>`
        WITH ranked AS (
          SELECT
            c.id AS "categoryId",
            c.name AS "categoryName",
            s.id AS "sourceId",
            s.name AS "sourceName",
            s.url AS "sourceUrl",
            s.brief AS "sourceBrief",
            ROW_NUMBER() OVER (
              PARTITION BY c.id
              ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC NULLS LAST, s.id DESC
            ) AS rn
          FROM ai_assets_marketplace.categories c
          JOIN ai_assets_marketplace.sources s ON s.category_id = c.id
        )
        SELECT
          "categoryId",
          "categoryName",
          "sourceId",
          "sourceName",
          "sourceUrl",
          "sourceBrief"
        FROM ranked
        WHERE rn <= ${limitPerCategory}
        ORDER BY "categoryName" ASC, "sourceName" ASC
      `;

      const grouped = new Map<number, ResearchSourceCategory>();

      this.extractRows(rows).forEach((row) => {
        const categoryId = Number(row.categoryId);
        if (!grouped.has(categoryId)) {
          grouped.set(categoryId, {
            id: categoryId,
            name: String(row.categoryName),
            sources: [],
          });
        }
        grouped.get(categoryId)!.sources.push({
          id: Number(row.sourceId),
          name: String(row.sourceName || ''),
          url: String(row.sourceUrl || ''),
          brief: row.sourceBrief ?? null,
        });
      });

      return {
        available: true,
        categories: Array.from(grouped.values()),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ...empty, error: `Research source listing unavailable: ${message}` };
    }
  }

  async getResearchSkillCounts(): Promise<{
    available: boolean;
    counts: MarketplaceResearchSkillCounts;
    error?: string;
  }> {
    const empty: MarketplaceResearchSkillCounts = {
      categories: 0,
      sources: 0,
      sourceLinks: 0,
      files: 0,
    };

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { available: false, counts: empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const [categories] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.skill_categories`;
      const [sources] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.skill_sources`;
      const [sourceLinks] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.skill_links`;
      const [files] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.skill_files`;

      return {
        available: true,
        counts: {
          categories: Number(categories?.n || 0),
          sources: Number(sources?.n || 0),
          sourceLinks: Number(sourceLinks?.n || 0),
          files: Number(files?.n || 0),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        available: false,
        counts: empty,
        error: `Research skill tables unavailable: ${message}`,
      };
    }
  }

  async getResearchSkillSources(input?: { limitPerCategory?: number }): Promise<{
    available: boolean;
    categories: Array<{
      id: number;
      name: string;
      sources: Array<{
        id: number;
        name: string;
        url: string;
        brief: string | null;
      }>;
    }>;
    error?: string;
  }> {
    type ResearchSkillSourceCategory = {
      id: number;
      name: string;
      sources: Array<{ id: number; name: string; url: string; brief: string | null }>;
    };
    const empty = { available: false, categories: [] as ResearchSkillSourceCategory[] };
    const limitPerCategory = Math.max(1, Math.min(Number(input?.limitPerCategory) || 8, 20));

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { ...empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const rows = await this.dbClient<MarketplaceResearchSkillSourceRow[]>`
        WITH ranked AS (
          SELECT
            c.id AS "categoryId",
            c.name AS "categoryName",
            s.id AS "sourceId",
            s.name AS "sourceName",
            s.url AS "sourceUrl",
            s.brief AS "sourceBrief",
            ROW_NUMBER() OVER (
              PARTITION BY c.id
              ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC NULLS LAST, s.id DESC
            ) AS rn
          FROM ai_assets_marketplace.skill_categories c
          JOIN ai_assets_marketplace.skill_sources s ON s.category_id = c.id
        )
        SELECT
          "categoryId",
          "categoryName",
          "sourceId",
          "sourceName",
          "sourceUrl",
          "sourceBrief"
        FROM ranked
        WHERE rn <= ${limitPerCategory}
        ORDER BY "categoryName" ASC, "sourceName" ASC
      `;

      const grouped = new Map<number, ResearchSkillSourceCategory>();

      this.extractRows(rows).forEach((row) => {
        const categoryId = Number(row.categoryId);
        if (!grouped.has(categoryId)) {
          grouped.set(categoryId, {
            id: categoryId,
            name: String(row.categoryName),
            sources: [],
          });
        }
        grouped.get(categoryId)!.sources.push({
          id: Number(row.sourceId),
          name: String(row.sourceName || ''),
          url: String(row.sourceUrl || ''),
          brief: row.sourceBrief ?? null,
        });
      });

      return {
        available: true,
        categories: Array.from(grouped.values()),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ...empty, error: `Research skill source listing unavailable: ${message}` };
    }
  }

  async searchResearchSkillFiles(input: {
    q?: string;
    sourceId?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    items: Array<
      MarketplaceResearchSkillFileRow & {
        snippet: string;
      }
    >;
    total: number;
    available: boolean;
    error?: string;
  }> {
    const empty = {
      items: [] as Array<MarketplaceResearchSkillFileRow & { snippet: string }>,
      total: 0,
      available: false,
    };
    const q = this.sanitizeText(input.q || '', MAX_DESCRIPTION_LENGTH).toLowerCase();
    const sourceId = Number.isFinite(input.sourceId) ? Number(input.sourceId) : 0;
    const limit = this.normalizeLimit(input.limit);
    const offset = this.normalizeOffset(input.offset);

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { ...empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const whereLike = `%${q}%`;
      const queryFilter = q
        ? this.dbClient`
            AND (
              lower(coalesce(f.title, '')) LIKE ${whereLike}
              OR lower(coalesce(f.file_path, '')) LIKE ${whereLike}
              OR lower(coalesce(f.tags, '')) LIKE ${whereLike}
              OR lower(f.content) LIKE ${whereLike}
            )
          `
        : this.dbClient``;

      const sourceFilter = sourceId
        ? this.dbClient`AND f.source_id = ${sourceId}`
        : this.dbClient``;

      const totalRows = await this.dbClient`
        SELECT COUNT(*)::int AS n
        FROM ai_assets_marketplace.skill_files f
        WHERE 1 = 1
        ${queryFilter}
        ${sourceFilter}
      `;

      const rows = await this.dbClient<MarketplaceResearchSkillFileRow[]>`
        SELECT
          f.id,
          f.source_id AS "sourceId",
          s.name AS "sourceName",
          c.name AS "categoryName",
          f.repo_url AS "repoUrl",
          f.file_url AS "fileUrl",
          f.file_path AS "filePath",
          f.title,
          f.content,
          f.license,
          f.tags,
          f.created_at AS "createdAt"
        FROM ai_assets_marketplace.skill_files f
        LEFT JOIN ai_assets_marketplace.skill_sources s ON s.id = f.source_id
        LEFT JOIN ai_assets_marketplace.skill_categories c ON c.id = s.category_id
        WHERE 1 = 1
        ${queryFilter}
        ${sourceFilter}
        ORDER BY f.id DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      return {
        available: true,
        items: this.extractRows(rows).map((row) => {
          const content = String(row.content || '');
          const snippet = content.slice(0, 1200);
          return {
            id: Number(row.id),
            sourceId: Number(row.sourceId),
            sourceName: row.sourceName ?? null,
            categoryName: row.categoryName ?? null,
            repoUrl: row.repoUrl ?? null,
            fileUrl: String(row.fileUrl || ''),
            filePath: row.filePath ?? null,
            title: row.title ?? null,
            content,
            snippet,
            license: row.license ?? null,
            tags: row.tags ?? null,
            createdAt: row.createdAt ?? null,
          };
        }),
        total: Number(this.extractRows(totalRows)[0]?.n || 0),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ...empty, error: `Research skill file search unavailable: ${message}` };
    }
  }

  async getResearchSkillMarketplaceCounts(): Promise<{
    available: boolean;
    counts: MarketplaceResearchSkillMarketplaceCounts;
    error?: string;
  }> {
    const empty: MarketplaceResearchSkillMarketplaceCounts = {
      entries: 0,
    };

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { available: false, counts: empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const [entries] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.skill_marketplace_entries`;
      return {
        available: true,
        counts: {
          entries: Number(entries?.n || 0),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        available: false,
        counts: empty,
        error: `Research skill marketplace tables unavailable: ${message}`,
      };
    }
  }

  async listResearchSkillMarketplaceEntries(input: {
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    items: MarketplaceResearchSkillMarketplaceEntryRow[];
    total: number;
    available: boolean;
    error?: string;
  }> {
    const empty = {
      items: [] as MarketplaceResearchSkillMarketplaceEntryRow[],
      total: 0,
      available: false,
    };
    const q = this.sanitizeText(input.q || '', MAX_DESCRIPTION_LENGTH).toLowerCase();
    const limit = this.normalizeLimit(input.limit);
    const offset = this.normalizeOffset(input.offset);

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { ...empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const whereLike = `%${q}%`;
      const whereClause = q
        ? this.dbClient`
            WHERE lower(coalesce(source, '')) LIKE ${whereLike}
               OR lower(coalesce(title, '')) LIKE ${whereLike}
               OR lower(coalesce(brief, '')) LIKE ${whereLike}
               OR lower(coalesce(tags, '')) LIKE ${whereLike}
               OR lower(coalesce(entry_url, '')) LIKE ${whereLike}
          `
        : this.dbClient``;

      const totalRows = await this.dbClient`
        SELECT COUNT(*)::int AS n
        FROM ai_assets_marketplace.skill_marketplace_entries
        ${whereClause}
      `;

      const rows = await this.dbClient<MarketplaceResearchSkillMarketplaceEntryRow[]>`
        SELECT
          id,
          source,
          entry_url AS "entryUrl",
          title,
          brief,
          tags,
          discovered_at AS "discoveredAt"
        FROM ai_assets_marketplace.skill_marketplace_entries
        ${whereClause}
        ORDER BY id DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      return {
        available: true,
        items: this.extractRows(rows).map((row) => ({
          id: Number(row.id),
          source: String(row.source || ''),
          entryUrl: String(row.entryUrl || ''),
          title: row.title ?? null,
          brief: row.brief ?? null,
          tags: row.tags ?? null,
          discoveredAt: row.discoveredAt ?? null,
        })),
        total: Number(this.extractRows(totalRows)[0]?.n || 0),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ...empty, error: `Skill marketplace listing unavailable: ${message}` };
    }
  }

  async getResearchMcpCounts(): Promise<{
    available: boolean;
    counts: MarketplaceResearchMcpCounts;
    error?: string;
  }> {
    const empty: MarketplaceResearchMcpCounts = {
      categories: 0,
      sources: 0,
      links: 0,
      servers: 0,
    };

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { available: false, counts: empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const [categories] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.mcp_categories`;
      const [sources] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.mcp_sources`;
      const [links] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.mcp_links`;
      const [servers] = await this
        .dbClient`SELECT COUNT(*)::int AS n FROM ai_assets_marketplace.mcp_servers`;

      return {
        available: true,
        counts: {
          categories: Number(categories?.n || 0),
          sources: Number(sources?.n || 0),
          links: Number(links?.n || 0),
          servers: Number(servers?.n || 0),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        available: false,
        counts: empty,
        error: `MCP research tables unavailable: ${message}`,
      };
    }
  }

  async getResearchMcpSources(input?: { limitPerCategory?: number }): Promise<{
    available: boolean;
    categories: Array<{
      id: number;
      name: string;
      sources: Array<{
        id: number;
        name: string;
        url: string;
        brief: string | null;
      }>;
    }>;
    error?: string;
  }> {
    type ResearchMcpSourceCategory = {
      id: number;
      name: string;
      sources: Array<{ id: number; name: string; url: string; brief: string | null }>;
    };
    const empty = { available: false, categories: [] as ResearchMcpSourceCategory[] };
    const limitPerCategory = Math.max(1, Math.min(Number(input?.limitPerCategory) || 8, 30));

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { ...empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const rows = await this.dbClient<MarketplaceResearchMcpSourceRow[]>`
        WITH ranked AS (
          SELECT
            c.id AS "categoryId",
            c.name AS "categoryName",
            s.id AS "sourceId",
            s.name AS "sourceName",
            s.url AS "sourceUrl",
            s.brief AS "sourceBrief",
            ROW_NUMBER() OVER (
              PARTITION BY c.id
              ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC NULLS LAST, s.id DESC
            ) AS rn
          FROM ai_assets_marketplace.mcp_categories c
          JOIN ai_assets_marketplace.mcp_sources s ON s.category_id = c.id
        )
        SELECT
          "categoryId",
          "categoryName",
          "sourceId",
          "sourceName",
          "sourceUrl",
          "sourceBrief"
        FROM ranked
        WHERE rn <= ${limitPerCategory}
        ORDER BY "categoryName" ASC, "sourceName" ASC
      `;

      const grouped = new Map<number, ResearchMcpSourceCategory>();
      this.extractRows(rows).forEach((row) => {
        const categoryId = Number(row.categoryId);
        if (!grouped.has(categoryId)) {
          grouped.set(categoryId, {
            id: categoryId,
            name: String(row.categoryName),
            sources: [],
          });
        }
        grouped.get(categoryId)!.sources.push({
          id: Number(row.sourceId),
          name: String(row.sourceName || ''),
          url: String(row.sourceUrl || ''),
          brief: row.sourceBrief ?? null,
        });
      });

      return { available: true, categories: Array.from(grouped.values()) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ...empty, error: `MCP source listing unavailable: ${message}` };
    }
  }

  async searchResearchMcpServers(input: { q?: string; limit?: number; offset?: number }): Promise<{
    items: MarketplaceResearchMcpServerRow[];
    total: number;
    available: boolean;
    error?: string;
  }> {
    const empty = {
      items: [] as MarketplaceResearchMcpServerRow[],
      total: 0,
      available: false,
    };
    const q = this.sanitizeText(input.q || '', MAX_DESCRIPTION_LENGTH).toLowerCase();
    const limit = this.normalizeLimit(input.limit);
    const offset = this.normalizeOffset(input.offset);

    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { ...empty, error: 'Marketplace DB unavailable' };
    }

    try {
      const whereLike = `%${q}%`;
      const whereClause = q
        ? this.dbClient`
            WHERE lower(coalesce(server_name, '')) LIKE ${whereLike}
               OR lower(coalesce(description, '')) LIKE ${whereLike}
               OR lower(coalesce(tags, '')) LIKE ${whereLike}
               OR lower(coalesce(maintainer, '')) LIKE ${whereLike}
               OR lower(coalesce(server_url, '')) LIKE ${whereLike}
               OR lower(coalesce(repo_url, '')) LIKE ${whereLike}
          `
        : this.dbClient``;

      const totalRows = await this.dbClient`
        SELECT COUNT(*)::int AS n
        FROM ai_assets_marketplace.mcp_servers
        ${whereClause}
      `;

      const rows = await this.dbClient<MarketplaceResearchMcpServerRow[]>`
        SELECT
          id,
          source_id AS "sourceId",
          server_name AS "serverName",
          server_url AS "serverUrl",
          repo_url AS "repoUrl",
          description,
          tags,
          maintainer,
          stars,
          license,
          transport,
          created_at AS "createdAt"
        FROM ai_assets_marketplace.mcp_servers
        ${whereClause}
        ORDER BY id DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      return {
        available: true,
        items: this.extractRows(rows).map((row) => ({
          id: Number(row.id),
          sourceId: row.sourceId == null ? null : Number(row.sourceId),
          serverName: String(row.serverName || ''),
          serverUrl: row.serverUrl ?? null,
          repoUrl: row.repoUrl ?? null,
          description: row.description ?? null,
          tags: row.tags ?? null,
          maintainer: row.maintainer ?? null,
          stars: row.stars == null ? null : Number(row.stars),
          license: row.license ?? null,
          transport: row.transport ?? null,
          createdAt: row.createdAt ?? null,
        })),
        total: Number(this.extractRows(totalRows)[0]?.n || 0),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ...empty, error: `MCP server search unavailable: ${message}` };
    }
  }

  async triggerResearchCrawl(input?: { command?: string; dryRun?: boolean }): Promise<{
    accepted: boolean;
    runId: string;
    status: string;
    command?: string;
    message?: string;
    error?: string;
  }> {
    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      throw new BadRequestException('Marketplace DB unavailable');
    }

    const runId = `crawl-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const command =
      this.sanitizeText(input?.command, MAX_DESCRIPTION_LENGTH) ||
      this.sanitizeText(process.env.CRAWL4AI_PIPELINE_COMMAND, MAX_DESCRIPTION_LENGTH);

    await this.upsertCrawlRun({
      id: runId,
      status: input?.dryRun ? 'dry_run' : 'queued',
      startedAt: new Date().toISOString(),
      finishedAt: input?.dryRun ? new Date().toISOString() : null,
      stats: input?.dryRun ? { dryRun: true } : null,
      error: !command ? 'CRAWL4AI_PIPELINE_COMMAND is not configured' : null,
    });

    if (!command) {
      return {
        accepted: false,
        runId,
        status: 'failed',
        error: 'CRAWL4AI_PIPELINE_COMMAND is not configured',
      };
    }

    if (input?.dryRun) {
      return {
        accepted: true,
        runId,
        status: 'dry_run',
        command,
        message: 'Dry run recorded; crawl command not executed.',
      };
    }

    this.activeResearchRuns.add(runId);
    const startedAt = new Date().toISOString();
    this.researchRunStartedAt.set(runId, startedAt);
    await this.upsertCrawlRun({
      id: runId,
      status: 'running',
      startedAt,
      finishedAt: null,
      stats: null,
      error: null,
    });

    const child = spawn('sh', ['-lc', command], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdoutBuffer = '';
    let stderrBuffer = '';

    child.stdout.on('data', (chunk) => {
      stdoutBuffer = `${stdoutBuffer}${String(chunk)}`.slice(-16000);
    });
    child.stderr.on('data', (chunk) => {
      stderrBuffer = `${stderrBuffer}${String(chunk)}`.slice(-16000);
    });

    child.on('close', async (code) => {
      const finishedAt = new Date().toISOString();
      const status = code === 0 ? 'succeeded' : 'failed';
      const stats = code === 0 ? this.tryParseLastJsonObject(stdoutBuffer) : null;
      const error =
        code === 0 ? null : this.sanitizeText(stderrBuffer || `exit code ${code}`, 8000);
      const startedAt = this.researchRunStartedAt.get(runId) || new Date().toISOString();
      try {
        await this.upsertCrawlRun({
          id: runId,
          status,
          startedAt,
          finishedAt,
          stats,
          error,
        });
      } finally {
        this.activeResearchRuns.delete(runId);
        this.researchRunStartedAt.delete(runId);
      }
    });

    child.on('error', async (err) => {
      const startedAt = this.researchRunStartedAt.get(runId) || new Date().toISOString();
      try {
        await this.upsertCrawlRun({
          id: runId,
          status: 'failed',
          startedAt,
          finishedAt: new Date().toISOString(),
          stats: null,
          error: this.sanitizeText(err.message, 8000),
        });
      } finally {
        this.activeResearchRuns.delete(runId);
        this.researchRunStartedAt.delete(runId);
      }
    });

    return {
      accepted: true,
      runId,
      status: 'running',
      command,
      message: 'Crawl job started in background.',
    };
  }

  async getResearchCrawlRun(
    id: string
  ): Promise<{ available: boolean; run: MarketplaceCrawlRunRow | null; error?: string }> {
    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { available: false, run: null, error: 'Marketplace DB unavailable' };
    }

    try {
      const rows = await this.dbClient`
        SELECT
          id,
          status,
          started_at AS "startedAt",
          finished_at AS "finishedAt",
          stats,
          error
        FROM ai_assets_marketplace.crawl_runs
        WHERE id = ${id}
        LIMIT 1
      `;
      const row = this.extractRows(rows)[0];
      return { available: true, run: row ? this.mapCrawlRunRow(row) : null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { available: false, run: null, error: `Crawl run lookup unavailable: ${message}` };
    }
  }

  async listResearchCrawlRuns(limit = 20): Promise<{
    available: boolean;
    items: MarketplaceCrawlRunRow[];
    total: number;
    error?: string;
  }> {
    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      return { available: false, items: [], total: 0, error: 'Marketplace DB unavailable' };
    }

    const boundedLimit = Math.max(1, Math.min(Number(limit) || 20, 200));
    try {
      const totalRows = await this.dbClient`
        SELECT COUNT(*)::int AS n
        FROM ai_assets_marketplace.crawl_runs
      `;
      const rows = await this.dbClient`
        SELECT
          id,
          status,
          started_at AS "startedAt",
          finished_at AS "finishedAt",
          stats,
          error
        FROM ai_assets_marketplace.crawl_runs
        ORDER BY started_at DESC
        LIMIT ${boundedLimit}
      `;
      return {
        available: true,
        items: this.extractRows(rows).map((row) => this.mapCrawlRunRow(row)),
        total: Number(this.extractRows(totalRows)[0]?.n || 0),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        available: false,
        items: [],
        total: 0,
        error: `Crawl run listing unavailable: ${message}`,
      };
    }
  }

  async getItemById(id: string): Promise<MarketplaceCatalogItem | null> {
    await this.ensureInitialized();
    const row = await drizzleMarketplaceCatalogRepository.findByIdOrSlug(id);
    return row ? this.mapCatalogRowToItem(row) : null;
  }

  async submitExperience(
    input: MarketplaceExperienceSubmissionInput
  ): Promise<MarketplaceCatalogItem> {
    const validated = this.validateSubmissionInput(input);
    const tags = validated.tags ?? [];
    const now = new Date().toISOString();
    const existingItems = await this.getAllItems();
    const id = this.generateUniqueId('exp-community', existingItems);
    const slug = this.generateUniqueSlug(validated.name, existingItems);

    const item: MarketplaceCatalogItem = {
      id,
      slug,
      name: validated.name,
      description: validated.description,
      kind: 'experience',
      category: validated.category,
      tags: tags.length > 0 ? tags : ['community', 'ugc'],
      capabilities: ['ugc_submission'],
      rating: 0,
      totalRuns: 0,
      successRate: 0,
      pricePerRun: 0,
      status: 'online',
      publicationStatus: 'review',
      launchUrl: validated.launchUrl,
      createdBy: validated.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await this.persistItem(item, false);
    return item;
  }

  async submitCatalogItem(
    input: MarketplaceCatalogSubmissionInput
  ): Promise<MarketplaceCatalogItem> {
    const validated = this.validateSubmissionInput(input);
    const tags = validated.tags ?? [];
    const normalizedKind = this.normalizeKind(input.kind);
    if (!normalizedKind) {
      throw new BadRequestException('kind is required and must be a valid catalog kind');
    }

    if (normalizedKind === 'experience') {
      return this.submitExperience(validated);
    }

    const now = new Date().toISOString();
    const existingItems = await this.getAllItems();
    const prefix = normalizedKind.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const id = this.generateUniqueId(prefix, existingItems);
    const slug = this.generateUniqueSlug(validated.name, existingItems);
    const capabilities = this.normalizeUniqueStrings(input.capabilities, MAX_CAPABILITIES);

    const item: MarketplaceCatalogItem = {
      id,
      slug,
      name: validated.name,
      description: validated.description,
      kind: normalizedKind,
      category: validated.category,
      tags: tags.length > 0 ? tags : [normalizedKind, 'community'],
      capabilities: capabilities.length > 0 ? capabilities : ['community_submission'],
      rating: 0,
      totalRuns: 0,
      successRate: 0,
      pricePerRun: 0,
      status: 'online',
      publicationStatus: 'review',
      launchUrl: validated.launchUrl,
      createdBy: validated.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await this.persistItem(item, false);
    return item;
  }

  async transitionPublicationStatus(input: {
    id: string;
    toStatus: MarketplacePublicationStatus;
    moderatedBy?: string;
  }): Promise<MarketplaceCatalogItem | null> {
    const item = await this.getItemById(input.id);
    if (!item) {
      return null;
    }

    if (!this.isTransitionAllowed(item.publicationStatus, input.toStatus)) {
      throw new Error(
        `Invalid publication transition: ${item.publicationStatus} -> ${input.toStatus}`
      );
    }

    const updated: MarketplaceCatalogItem = {
      ...item,
      publicationStatus: input.toStatus,
      updatedAt: new Date().toISOString(),
      createdBy: item.createdBy || input.moderatedBy,
    };

    await this.persistItem(updated, true);
    return updated;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized || !this.dbEnabled) {
      return;
    }

    try {
      const connectionString =
        process.env.MARKETPLACE_DATABASE_URL || process.env.DATABASE_URL || '';
      if (!connectionString) {
        throw new Error('No MARKETPLACE_DATABASE_URL or DATABASE_URL configured');
      }

      this.dbClient = postgres(connectionString, {
        max: Number(process.env.MARKETPLACE_DB_MAX_CONNECTIONS || 5),
        idle_timeout: 20,
        connect_timeout: 10,
        onnotice: () => {},
      });

      await this.dbClient`SELECT 1`;

      // Mark initialized before seed inserts to avoid re-entrant ensureInitialized calls.
      this.initialized = true;
      const rowCount = await drizzleMarketplaceCatalogRepository.count();
      if (rowCount === 0) {
        for (const item of this.seedItems) {
          await this.persistItem(item, false);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `MarketplaceService: failed to initialize database-backed catalog. (${message})`
      );
      this.dbEnabled = false;
      this.initialized = true;
    }
  }

  private async getAllItems(): Promise<MarketplaceCatalogItem[]> {
    await this.ensureInitialized();

    const rows = await drizzleMarketplaceCatalogRepository.findAll();
    return rows.map((row: any) => this.mapCatalogRowToItem(row));
  }

  private async persistItem(item: MarketplaceCatalogItem, upsert: boolean): Promise<void> {
    await this.ensureInitialized();

    try {
      if (upsert) {
        await drizzleMarketplaceCatalogRepository.upsert({
          id: item.id,
          slug: item.slug,
          name: item.name,
          description: item.description,
          kind: item.kind,
          category: item.category,
          tags: item.tags || [],
          capabilities: item.capabilities || [],
          rating: item.rating,
          totalRuns: item.totalRuns,
          successRate: item.successRate,
          pricePerRun: item.pricePerRun,
          status: item.status,
          publicationStatus: item.publicationStatus,
          launchUrl: item.launchUrl ?? null,
          avatarUrl: item.avatarUrl ?? null,
          createdBy: item.createdBy ?? null,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        });
        return;
      }

      await drizzleMarketplaceCatalogRepository.insertIfMissing({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        kind: item.kind,
        category: item.category,
        tags: item.tags || [],
        capabilities: item.capabilities || [],
        rating: item.rating,
        totalRuns: item.totalRuns,
        successRate: item.successRate,
        pricePerRun: item.pricePerRun,
        status: item.status,
        publicationStatus: item.publicationStatus,
        launchUrl: item.launchUrl ?? null,
        avatarUrl: item.avatarUrl ?? null,
        createdBy: item.createdBy ?? null,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = (error as { code?: string })?.code;
      if (
        code === '23505' ||
        message.includes('duplicate key value') ||
        message.includes('marketplace_catalog_items_slug_key') ||
        message.includes('marketplace_catalog_items_slug_uq')
      ) {
        throw new BadRequestException('A catalog item with a similar name already exists');
      }
      throw error;
    }
  }

  private extractRows(result: unknown): any[] {
    if (Array.isArray(result)) {
      return result;
    }
    if (result && typeof result === 'object') {
      const maybeRows = (result as any).rows;
      if (Array.isArray(maybeRows)) {
        return maybeRows;
      }
    }
    return [];
  }

  private mapCatalogRowToItem(row: any): MarketplaceCatalogItem {
    const normalizeArray = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value.map((entry) => String(entry));
      }
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.map((entry) => String(entry));
          }
        } catch {
          return [];
        }
      }
      return [];
    };

    return {
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: String(row.description),
      kind: this.normalizeKind(String(row.kind)) || 'experience',
      category: String(row.category),
      tags: normalizeArray(row.tags),
      capabilities: normalizeArray(row.capabilities),
      rating: Number(row.rating || 0),
      totalRuns: Number((row.totalRuns ?? row.total_runs) || 0),
      successRate: Number((row.successRate ?? row.success_rate) || 0),
      pricePerRun: Number((row.pricePerRun ?? row.price_per_run) || 0),
      status: String(row.status || 'online') as 'online' | 'busy' | 'offline',
      publicationStatus:
        this.normalizeStatus(String(row.publicationStatus ?? row.publication_status)) || 'draft',
      launchUrl:
        row.launchUrl || row.launch_url ? String(row.launchUrl ?? row.launch_url) : undefined,
      avatarUrl:
        row.avatarUrl || row.avatar_url ? String(row.avatarUrl ?? row.avatar_url) : undefined,
      createdBy:
        row.createdBy || row.created_by ? String(row.createdBy ?? row.created_by) : undefined,
      createdAt: new Date((row.createdAt ?? row.created_at) || Date.now()).toISOString(),
      updatedAt: new Date((row.updatedAt ?? row.updated_at) || Date.now()).toISOString(),
    };
  }

  private mapCrawlRunRow(row: any): MarketplaceCrawlRunRow {
    return {
      id: String(row.id),
      status: String(row.status),
      startedAt: new Date(row.startedAt || row.started_at || Date.now()).toISOString(),
      finishedAt:
        row.finishedAt || row.finished_at
          ? new Date(row.finishedAt || row.finished_at).toISOString()
          : null,
      stats: row.stats && typeof row.stats === 'object' ? row.stats : null,
      error: row.error ? String(row.error) : null,
    };
  }

  private async upsertCrawlRun(run: MarketplaceCrawlRunRow): Promise<void> {
    if (!this.dbClient) {
      throw new Error('Marketplace DB client is not initialized');
    }
    await this.dbClient`
      INSERT INTO ai_assets_marketplace.crawl_runs (
        id,
        status,
        started_at,
        finished_at,
        stats,
        error
      ) VALUES (
        ${run.id},
        ${run.status},
        ${run.startedAt},
        ${run.finishedAt},
        ${run.stats ? JSON.stringify(run.stats) : null}::jsonb,
        ${run.error}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        started_at = EXCLUDED.started_at,
        finished_at = EXCLUDED.finished_at,
        stats = EXCLUDED.stats,
        error = EXCLUDED.error
    `;
  }

  private tryParseLastJsonObject(raw: string): Record<string, unknown> | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const lines = trimmed.split('\n').reverse();
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, unknown>;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  private validateSubmissionInput(
    input: MarketplaceExperienceSubmissionInput
  ): MarketplaceExperienceSubmissionInput {
    const name = this.sanitizeText(input.name, MAX_TEXT_LENGTH);
    const description = this.sanitizeText(input.description, MAX_DESCRIPTION_LENGTH);
    const category = this.sanitizeText(input.category, MAX_TEXT_LENGTH).toLowerCase();
    const launchUrl = this.normalizeUrl(input.launchUrl);
    const tags = this.normalizeUniqueStrings(input.tags, MAX_TAGS);
    const createdBy = this.sanitizeText(
      input.createdBy || 'community',
      MAX_TEXT_LENGTH
    ).toLowerCase();

    if (!name) {
      throw new BadRequestException('name is required');
    }

    if (!description) {
      throw new BadRequestException('description is required');
    }

    if (!category) {
      throw new BadRequestException('category is required');
    }

    return {
      name,
      description,
      category,
      launchUrl,
      tags,
      createdBy,
    };
  }

  private sanitizeText(value: unknown, maxLength: number): string {
    const normalized = String(value ?? '')
      .replace(/\s+/g, ' ')
      .trim();

    return normalized.slice(0, maxLength);
  }

  private normalizeUrl(raw?: string): string | undefined {
    if (!raw) {
      return undefined;
    }

    const value = this.sanitizeText(raw, MAX_DESCRIPTION_LENGTH);
    if (!value) {
      return undefined;
    }

    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new BadRequestException('launchUrl must use http or https');
      }
      return parsed.toString();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('launchUrl must be a valid URL');
    }
  }

  private normalizeUniqueStrings(values: unknown, limit: number): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    const seen = new Set<string>();
    const result: string[] = [];

    for (const entry of values) {
      const normalized = this.sanitizeText(entry, MAX_TEXT_LENGTH).toLowerCase();
      if (!normalized || seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      result.push(normalized);
      if (result.length >= limit) {
        break;
      }
    }

    return result;
  }

  private generateUniqueId(prefix: string, existingItems: MarketplaceCatalogItem[]): string {
    const existing = new Set(existingItems.map((item) => item.id));
    let counter = 0;
    let candidate = `${prefix}-${Date.now()}`;
    while (existing.has(candidate)) {
      counter += 1;
      candidate = `${prefix}-${Date.now()}-${counter}`;
    }
    return candidate;
  }

  private generateUniqueSlug(baseName: string, existingItems: MarketplaceCatalogItem[]): string {
    const baseSlug =
      this.sanitizeText(baseName, MAX_TEXT_LENGTH)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'item';
    const existing = new Set(existingItems.map((item) => item.slug));
    let counter = 0;
    let candidate = baseSlug;
    while (existing.has(candidate)) {
      counter += 1;
      candidate = `${baseSlug}-${counter}`;
    }
    return candidate;
  }

  private normalizeKind(raw?: string): MarketplaceKind | undefined {
    if (!raw) return undefined;
    const value = String(raw).toLowerCase();
    const valid: MarketplaceKind[] = [
      'experience',
      'workflow',
      'mcp_server',
      'skill',
      'prompt',
      'agent_template',
      'agent',
      'model',
    ];
    return valid.includes(value as MarketplaceKind) ? (value as MarketplaceKind) : undefined;
  }

  private normalizeStatus(raw?: string): MarketplacePublicationStatus | undefined {
    if (!raw) return undefined;
    const value = String(raw).toLowerCase();
    const valid: MarketplacePublicationStatus[] = ['draft', 'review', 'published', 'archived'];
    return valid.includes(value as MarketplacePublicationStatus)
      ? (value as MarketplacePublicationStatus)
      : undefined;
  }

  private normalizeLimit(raw?: number): number {
    const parsed = Number(raw ?? 50);
    if (!Number.isFinite(parsed) || parsed <= 0) return 50;
    return Math.min(parsed, 200);
  }

  private normalizeOffset(raw?: number): number {
    const parsed = Number(raw ?? 0);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  }

  private isTransitionAllowed(
    from: MarketplacePublicationStatus,
    to: MarketplacePublicationStatus
  ): boolean {
    if (from === to) return true;

    const allowed: Record<MarketplacePublicationStatus, MarketplacePublicationStatus[]> = {
      draft: ['review', 'archived'],
      review: ['draft', 'published', 'archived'],
      published: ['review', 'archived'],
      archived: ['draft'],
    };

    return allowed[from].includes(to);
  }
}
