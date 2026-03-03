import { BadRequestException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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

@Injectable()
export class MarketplaceService implements OnModuleInit, OnModuleDestroy {
  private initialized = false;
  private dbEnabled = true;
  private dbClient: Sql | null = null;

  private readonly seedItems: MarketplaceCatalogItem[] = [
    {
      id: 'exp-open-audio-deck',
      slug: 'open-audio-deck',
      name: 'Open Audio Deck',
      description:
        'Spotify-style Audius client for streaming trending tracks and searching the Open Audio catalog.',
      kind: 'experience',
      category: 'music',
      tags: ['music', 'audius', 'streaming'],
      capabilities: ['music_streaming', 'playlist_discovery', 'audius_search'],
      rating: 4.9,
      totalRuns: 4200,
      successRate: 99.2,
      pricePerRun: 0,
      status: 'online',
      publicationStatus: 'published',
      launchUrl: 'https://open-audio-deck-production.up.railway.app',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'exp-merkaba-lab',
      slug: 'merkaba-lab',
      name: 'Merkaba Lab',
      description:
        'PoolTogether-inspired arcade lab with rotating jackpot physics, sidepot strategy, and replay loops.',
      kind: 'experience',
      category: 'pooltogether',
      tags: ['pooltogether', 'merkaba', 'lab'],
      capabilities: ['pool_variations', 'sidepot_strategy', 'jackpot_cycles'],
      rating: 4.8,
      totalRuns: 13370,
      successRate: 98.4,
      pricePerRun: 0,
      status: 'online',
      publicationStatus: 'published',
      launchUrl: 'https://ai-arcade.xyz/#merkaba-lab',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'exp-community-neon-kart',
      slug: 'community-neon-kart',
      name: 'Community Neon Kart',
      description:
        'User-created mini-game spotlight with rotating daily tracks and leaderboard ladders.',
      kind: 'experience',
      category: 'community',
      tags: ['community', 'ugc', 'games'],
      capabilities: ['ugc_game', 'daily_rotations', 'leaderboards'],
      rating: 4.5,
      totalRuns: 7310,
      successRate: 96.9,
      pricePerRun: 0,
      status: 'online',
      publicationStatus: 'review',
      launchUrl: 'https://ai-arcade.xyz/#community-neon-kart',
      createdBy: 'community',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'wf-compliance-handoff',
      slug: 'compliance-handoff-workflow',
      name: 'Compliance Handoff Workflow',
      description:
        'Workflow primitive for multi-step policy checks, red-team gates, and final review handoff.',
      kind: 'workflow',
      category: 'automation',
      tags: ['workflow', 'compliance', 'automation'],
      capabilities: ['multi_step_validation', 'review_gate', 'handoff'],
      rating: 4.7,
      totalRuns: 5210,
      successRate: 97.8,
      pricePerRun: 0.04,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'mcp-filesystem',
      slug: 'filesystem-mcp-server',
      name: 'Filesystem MCP Server',
      description: 'Provides secure filesystem access for AI agents through MCP.',
      kind: 'mcp_server',
      category: 'developer-tools',
      tags: ['mcp', 'filesystem', 'server'],
      capabilities: ['file_read', 'file_write', 'directory_listing'],
      rating: 4.6,
      totalRuns: 8921,
      successRate: 98.1,
      pricePerRun: 0,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'mcp-foundation',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'mcp-github',
      slug: 'github-mcp-server',
      name: 'GitHub MCP Server',
      description:
        'MCP server for repository operations, issue triage, and pull request workflows.',
      kind: 'mcp_server',
      category: 'developer-tools',
      tags: ['mcp', 'github', 'server'],
      capabilities: ['repo_read', 'repo_write', 'pr_management', 'issue_triage'],
      rating: 4.8,
      totalRuns: 11230,
      successRate: 98.7,
      pricePerRun: 0.01,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'skill-code-review-sentinel',
      slug: 'code-review-sentinel',
      name: 'Code Review Sentinel',
      description:
        'Security-aware review skill for pull requests with architecture and test quality checks.',
      kind: 'skill',
      category: 'development',
      tags: ['skill', 'code-review', 'security'],
      capabilities: ['code_review', 'security_analysis', 'test_gap_detection'],
      rating: 4.7,
      totalRuns: 9800,
      successRate: 97.3,
      pricePerRun: 0.06,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'prompt-growth-brief',
      slug: 'growth-brief-prompt-pack',
      name: 'Growth Brief Prompt Pack',
      description:
        'Prompt primitive for GTM planning, launch copy iteration, and experimentation loops.',
      kind: 'prompt',
      category: 'productivity',
      tags: ['prompt', 'growth', 'marketing'],
      capabilities: ['brief_generation', 'copy_iteration', 'experiment_planning'],
      rating: 4.5,
      totalRuns: 7020,
      successRate: 96.1,
      pricePerRun: 0.02,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'community',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'template-ops-director',
      slug: 'ops-director-template',
      name: 'Ops Director Template',
      description:
        'Ready-to-clone agent template for task intake, delegation, and multi-agent operations.',
      kind: 'agent_template',
      category: 'automation',
      tags: ['template', 'operations', 'automation'],
      capabilities: ['task_routing', 'delegation', 'execution_tracking'],
      rating: 4.8,
      totalRuns: 4330,
      successRate: 98.9,
      pricePerRun: 0.08,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'agent-tnf-director',
      slug: 'tnf-director',
      name: 'TNF Director',
      description: 'Master orchestrator for multi-agent swarms and complex workflow delegation.',
      kind: 'agent',
      category: 'automation',
      tags: ['agent', 'orchestration', 'workflow'],
      capabilities: ['orchestration', 'delegation', 'swarm_management'],
      rating: 5,
      totalRuns: 3200,
      successRate: 99.1,
      pricePerRun: 0.25,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'model-qwen3-coder-next',
      slug: 'qwen3-coder-next',
      name: 'Qwen3 Coder Next',
      description: 'High-speed coding and repository analysis primitive for developer workflows.',
      kind: 'model',
      category: 'code',
      tags: ['model', 'coder', 'code'],
      capabilities: ['code_generation', 'refactoring', 'repository_analysis'],
      rating: 4.9,
      totalRuns: 15420,
      successRate: 98.2,
      pricePerRun: 0.05,
      status: 'online',
      publicationStatus: 'published',
      createdBy: 'tnf-core',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'model-deepseek-r1',
      slug: 'deepseek-r1',
      name: 'DeepSeek R1',
      description:
        'Reasoning-first primitive for complex planning and advanced mathematical proofing.',
      kind: 'model',
      category: 'analytics',
      tags: ['model', 'reasoning', 'math'],
      capabilities: ['reasoning', 'complex_planning', 'proof_verification'],
      rating: 4.8,
      totalRuns: 8750,
      successRate: 97.5,
      pricePerRun: 0.1,
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

  async getItemById(id: string): Promise<MarketplaceCatalogItem | null> {
    const items = await this.getAllItems();
    return items.find((item) => item.id === id || item.slug === id) || null;
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

      await this.dbClient`
        CREATE TABLE IF NOT EXISTS marketplace_catalog_items (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          kind TEXT NOT NULL,
          category TEXT NOT NULL,
          tags JSONB NOT NULL DEFAULT '[]'::jsonb,
          capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
          rating DOUBLE PRECISION NOT NULL DEFAULT 0,
          total_runs INTEGER NOT NULL DEFAULT 0,
          success_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
          price_per_run DOUBLE PRECISION NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'online',
          publication_status TEXT NOT NULL DEFAULT 'draft',
          launch_url TEXT,
          avatar_url TEXT,
          created_by TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;

      const existingRows = await this.dbClient`
        SELECT id FROM marketplace_catalog_items LIMIT 1;
      `;

      // Mark initialized before seed inserts to avoid re-entrant ensureInitialized calls.
      this.initialized = true;
      const hasRows = this.extractRows(existingRows).length > 0;
      if (!hasRows) {
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

    if (!this.dbEnabled || !this.dbClient) {
      return [];
    }

    const result = await this.dbClient`
      SELECT
        id,
        slug,
        name,
        description,
        kind,
        category,
        tags,
        capabilities,
        rating,
        total_runs,
        success_rate,
        price_per_run,
        status,
        publication_status,
        launch_url,
        avatar_url,
        created_by,
        created_at,
        updated_at
      FROM marketplace_catalog_items
      ORDER BY created_at DESC;
    `;

    return this.extractRows(result).map((row) => this.mapRowToItem(row));
  }

  private async persistItem(item: MarketplaceCatalogItem, upsert: boolean): Promise<void> {
    await this.ensureInitialized();
    if (!this.dbEnabled || !this.dbClient) {
      throw new Error('Marketplace storage unavailable');
    }

    const tags = JSON.stringify(item.tags || []);
    const capabilities = JSON.stringify(item.capabilities || []);

    try {
      if (upsert) {
        await this.dbClient`
          INSERT INTO marketplace_catalog_items (
            id,
            slug,
            name,
            description,
            kind,
            category,
            tags,
            capabilities,
            rating,
            total_runs,
            success_rate,
            price_per_run,
            status,
            publication_status,
            launch_url,
            avatar_url,
            created_by,
            created_at,
            updated_at
          ) VALUES (
            ${item.id},
            ${item.slug},
            ${item.name},
            ${item.description},
            ${item.kind},
            ${item.category},
            CAST(${tags} AS jsonb),
            CAST(${capabilities} AS jsonb),
            ${item.rating},
            ${item.totalRuns},
            ${item.successRate},
            ${item.pricePerRun},
            ${item.status},
            ${item.publicationStatus},
            ${item.launchUrl ?? null},
            ${item.avatarUrl ?? null},
            ${item.createdBy ?? null},
            ${item.createdAt},
            ${item.updatedAt}
          )
          ON CONFLICT (id) DO UPDATE SET
            slug = EXCLUDED.slug,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            kind = EXCLUDED.kind,
            category = EXCLUDED.category,
            tags = EXCLUDED.tags,
            capabilities = EXCLUDED.capabilities,
            rating = EXCLUDED.rating,
            total_runs = EXCLUDED.total_runs,
            success_rate = EXCLUDED.success_rate,
            price_per_run = EXCLUDED.price_per_run,
            status = EXCLUDED.status,
            publication_status = EXCLUDED.publication_status,
            launch_url = EXCLUDED.launch_url,
            avatar_url = EXCLUDED.avatar_url,
            created_by = EXCLUDED.created_by,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at;
        `;
        return;
      }

      await this.dbClient`
        INSERT INTO marketplace_catalog_items (
          id,
          slug,
          name,
          description,
          kind,
          category,
          tags,
          capabilities,
          rating,
          total_runs,
          success_rate,
          price_per_run,
          status,
          publication_status,
          launch_url,
          avatar_url,
          created_by,
          created_at,
          updated_at
        ) VALUES (
          ${item.id},
          ${item.slug},
          ${item.name},
          ${item.description},
          ${item.kind},
          ${item.category},
          CAST(${tags} AS jsonb),
          CAST(${capabilities} AS jsonb),
          ${item.rating},
          ${item.totalRuns},
          ${item.successRate},
          ${item.pricePerRun},
          ${item.status},
          ${item.publicationStatus},
          ${item.launchUrl ?? null},
          ${item.avatarUrl ?? null},
          ${item.createdBy ?? null},
          ${item.createdAt},
          ${item.updatedAt}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('duplicate key value') ||
        message.includes('marketplace_catalog_items_slug_key')
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

  private mapRowToItem(row: any): MarketplaceCatalogItem {
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
      totalRuns: Number(row.total_runs || 0),
      successRate: Number(row.success_rate || 0),
      pricePerRun: Number(row.price_per_run || 0),
      status: String(row.status || 'online') as 'online' | 'busy' | 'offline',
      publicationStatus: this.normalizeStatus(String(row.publication_status)) || 'draft',
      launchUrl: row.launch_url ? String(row.launch_url) : undefined,
      avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
      createdBy: row.created_by ? String(row.created_by) : undefined,
      createdAt: new Date(row.created_at || Date.now()).toISOString(),
      updatedAt: new Date(row.updated_at || Date.now()).toISOString(),
    };
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
