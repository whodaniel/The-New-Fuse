import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type {
  ResourceSearchProtocolResponseEnvelope,
  ResourceSearchResponse,
} from '@the-new-fuse/types';
import type { Request } from 'express';
import { JwtAuth, SecureAuthGuard } from '../../guards/secure-auth.guard';
import { MarketplaceService } from '../marketplace/marketplace.service';
import {
  MarketplaceCatalogItem,
  MarketplaceCatalogSubmissionInput,
} from '../marketplace/marketplace.types';
import {
  CreatePersonalSkillDto,
  PersonalSkillDto,
  UpdatePersonalSkillDto,
} from './dto/personal-skill.dto';
import {
  ResourceSearchProtocolRequestEnvelopeDto,
  ResourceSearchProtocolResponseEnvelopeDto,
} from './dto/resource-search-protocol.dto';
import {
  ResourceDto,
  ResourceSearchEnvelopeDto,
  ResourceSearchMetaDto,
  ResourceSearchRequestDto,
} from './dto/resource-search.dto';
import { PersonalSkillsService } from './personal-skills.service';
import { ResourceInteractionService } from './resource-interaction.service';
import { ResourceRegistryApiKeyGuard } from './resource-registry-api-key.guard';
import { ResourceSearchPolicyService } from './resource-search-policy.service';
import { ResourceSearchProtocolService } from './resource-search-protocol.service';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly resourceSearchPolicyService: ResourceSearchPolicyService,
    private readonly resourceSearchProtocolService: ResourceSearchProtocolService,
    private readonly resourceInteractionService: ResourceInteractionService,
    private readonly personalSkillsService: PersonalSkillsService
  ) {}

  private resolveUserId(req: Request, fallbackUserId?: string): string {
    const requestUserId =
      typeof (req as Request & { user?: { id?: unknown } }).user?.id === 'string'
        ? ((req as Request & { user?: { id?: string } }).user?.id as string)
        : '';
    const userId = requestUserId || String(fallbackUserId || '').trim();
    if (!userId) {
      throw new BadRequestException('Authenticated user id is required');
    }
    return userId;
  }

  private mapCategory(
    category: string
  ): 'development' | 'productivity' | 'communication' | 'data' | 'automation' | 'ai' | 'other' {
    const value = String(category || '').toLowerCase();
    if (['development', 'developer-tools', 'code'].includes(value)) return 'development';
    if (['productivity', 'ops'].includes(value)) return 'productivity';
    if (['communication', 'social', 'chat'].includes(value)) return 'communication';
    if (['data', 'analytics'].includes(value)) return 'data';
    if (['automation', 'workflow'].includes(value)) return 'automation';
    if (['ai', 'model'].includes(value)) return 'ai';
    return 'other';
  }

  private toBaseResource(item: MarketplaceCatalogItem, type: 'skill' | 'workflow' | 'template') {
    const reviews = Math.max(0, Math.floor(item.totalRuns * 0.02));
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      type,
      category: this.mapCategory(item.category),
      tags: item.tags || [],
      author: item.createdBy || 'marketplace',
      version: '1.0.0',
      downloads: item.totalRuns || 0,
      rating: item.rating || 0,
      reviews,
      featured: item.rating >= 4.7 && item.publicationStatus === 'published',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      icon: item.avatarUrl,
      previewImage: item.avatarUrl,
    };
  }

  private toSkill(item: MarketplaceCatalogItem) {
    const skillType =
      item.kind === 'prompt'
        ? 'prompt'
        : item.kind === 'mcp_server' || item.kind === 'model'
          ? 'integration'
          : 'mcp-tool';
    return {
      ...this.toBaseResource(item, 'skill'),
      type: 'skill',
      skillType,
      capabilities: item.capabilities || [],
      modelCompatibility: ['gpt-4.1', 'o3', 'claude-3.7'],
      examples: [
        {
          title: `Use ${item.name}`,
          description: 'Run this resource from the marketplace surface.',
          input: `activate ${item.slug}`,
          output: 'resource activated',
        },
      ],
      documentation: item.launchUrl || `/api/marketplace/catalog/${item.id}`,
      sourceUrl: item.launchUrl,
      installCommand: `tnf marketplace install ${item.slug}`,
    };
  }

  private toWorkflow(item: MarketplaceCatalogItem) {
    const capabilityCount = item.capabilities?.length || 0;
    const complexity =
      capabilityCount >= 6 ? 'complex' : capabilityCount >= 3 ? 'medium' : 'simple';
    return {
      ...this.toBaseResource(item, 'workflow'),
      type: 'workflow',
      nodes: Math.max(3, capabilityCount * 2 || 3),
      triggers: item.tags?.length ? item.tags.slice(0, 3) : ['manual'],
      actions: item.capabilities?.length ? item.capabilities.slice(0, 5) : ['run'],
      integrations:
        item.tags?.filter((tag) => ['mcp', 'slack', 'github', 'notion'].includes(tag)) || [],
      complexity,
      workflowData: { marketplaceId: item.id, slug: item.slug },
      importUrl: item.launchUrl || `/api/marketplace/catalog/${item.id}`,
    };
  }

  private toTemplate(item: MarketplaceCatalogItem) {
    const tagSet = new Set((item.tags || []).map((tag) => tag.toLowerCase()));
    const templateType = tagSet.has('analysis')
      ? 'analysis'
      : tagSet.has('automation')
        ? 'automation'
        : tagSet.has('task')
          ? 'task'
          : 'chat';
    return {
      ...this.toBaseResource(item, 'template'),
      type: 'template',
      templateType,
      model: 'gpt-4.1',
      systemPrompt: `You are ${item.name}. ${item.description}`,
      capabilities: item.capabilities || [],
      configuration: {
        marketplaceId: item.id,
        slug: item.slug,
      },
      requiredSkills: item.tags?.slice(0, 3) || [],
      optionalSkills: item.tags?.slice(3, 6) || [],
    };
  }

  private async getPublishedCatalog() {
    const { items } = await this.marketplaceService.getCatalog({ status: 'published' });
    return items;
  }

  private normalizeText(value: unknown): string {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private normalizeTextList(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const seen = new Set<string>();
    const result: string[] = [];
    for (const entry of value) {
      const normalized = this.normalizeText(entry).toLowerCase();
      if (!normalized || seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      result.push(normalized);
    }
    return result;
  }

  private inferKindFromRegistryPayload(
    payload: Record<string, unknown>
  ): MarketplaceCatalogItem['kind'] {
    const categoryHint = this.normalizeText(payload.category).toUpperCase();
    const typeHint = this.normalizeText(payload.type).toUpperCase();
    const tagHints = this.normalizeTextList(payload.tags).join(' ');
    const allHints = `${categoryHint} ${typeHint} ${tagHints}`.trim();

    if (allHints.includes('WORKFLOW')) return 'workflow';
    if (allHints.includes('TEMPLATE')) return 'agent_template';
    if (allHints.includes('MODEL')) return 'model';
    if (allHints.includes('MCP')) return 'mcp_server';
    if (allHints.includes('PROMPT')) return 'prompt';
    if (allHints.includes('EXPERIENCE')) return 'experience';
    return 'skill';
  }

  private inferCategoryFromRegistryPayload(payload: Record<string, unknown>): string {
    const categoryHint = this.normalizeText(payload.category).toUpperCase();
    if (categoryHint.includes('WORKFLOW')) return 'automation';
    if (categoryHint.includes('MODEL')) return 'ai';
    if (categoryHint.includes('MCP')) return 'developer-tools';
    if (categoryHint.includes('PROMPT')) return 'productivity';
    if (categoryHint.includes('SKILL')) return 'development';

    const tags = this.normalizeTextList(payload.tags);
    return tags[0] || 'automation';
  }

  private mapRegistryPayloadToCatalogSubmission(
    payload: Record<string, unknown>
  ): MarketplaceCatalogSubmissionInput {
    const contentDescription =
      payload.content && typeof payload.content === 'object'
        ? this.normalizeText((payload.content as Record<string, unknown>).description)
        : '';
    const name = this.normalizeText(payload.name) || 'Imported Skill';
    const description =
      this.normalizeText(payload.description) ||
      contentDescription ||
      'Imported from skill-bank resource registry';
    const tags = Array.from(
      new Set([
        ...this.normalizeTextList(payload.tags),
        ...this.normalizeTextList(payload.keywords),
      ])
    ).slice(0, 12);
    const capabilities = [...tags].slice(0, 12);

    const sourceHint = this.normalizeText(payload.source).toLowerCase();
    const createdBy = sourceHint || 'skill-bank';

    return {
      name,
      description,
      kind: this.inferKindFromRegistryPayload(payload),
      category: this.inferCategoryFromRegistryPayload(payload),
      tags,
      capabilities,
      createdBy,
    };
  }

  @Post()
  @UseGuards(ResourceRegistryApiKeyGuard)
  @ApiOperation({ summary: 'Create resource registry entry (skill-bank ingest compatibility)' })
  async createResource(@Body() body: Record<string, unknown>) {
    const submission = this.mapRegistryPayloadToCatalogSubmission(body || {});

    // Idempotent behavior for bulk imports/retries.
    const { items } = await this.marketplaceService.getCatalog({
      q: submission.name,
      limit: 200,
    });
    const existing = items.find(
      (item) =>
        this.normalizeText(item.name).toLowerCase() === submission.name.toLowerCase() &&
        this.normalizeText(item.description).toLowerCase() ===
          submission.description.toLowerCase() &&
        this.normalizeText(item.createdBy).toLowerCase() === submission.createdBy?.toLowerCase()
    );
    if (existing) {
      return {
        ...existing,
        deduplicated: true,
      };
    }

    return await this.marketplaceService.submitCatalogItem(submission);
  }

  @Get()
  async getAllResources() {
    const items = await this.getPublishedCatalog();
    const skills = items
      .filter((item) => ['skill', 'prompt', 'mcp_server', 'model'].includes(item.kind))
      .map((item) => this.toSkill(item));
    const workflows = items
      .filter((item) => item.kind === 'workflow')
      .map((item) => this.toWorkflow(item));
    const templates = items
      .filter((item) => item.kind === 'agent_template')
      .map((item) => this.toTemplate(item));
    return [...skills, ...workflows, ...templates];
  }

  @Get('skills')
  async getSkills() {
    const items = await this.getPublishedCatalog();
    return items
      .filter((item) => ['skill', 'prompt', 'mcp_server', 'model'].includes(item.kind))
      .map((item) => this.toSkill(item));
  }

  @Get('workflows')
  async getWorkflows() {
    const items = await this.getPublishedCatalog();
    return items.filter((item) => item.kind === 'workflow').map((item) => this.toWorkflow(item));
  }

  @Get('templates')
  async getTemplates() {
    const items = await this.getPublishedCatalog();
    return items
      .filter((item) => item.kind === 'agent_template')
      .map((item) => this.toTemplate(item));
  }

  @Get('stats')
  async getStats() {
    const resources = await this.getAllResources();
    const totalResources = resources.length;
    const totalSkills = resources.filter((item) => item.type === 'skill').length;
    const totalWorkflows = resources.filter((item) => item.type === 'workflow').length;
    const totalTemplates = resources.filter((item) => item.type === 'template').length;
    const totalDownloads = resources.reduce((sum, item) => sum + (item.downloads || 0), 0);
    const averageRating =
      totalResources > 0
        ? Number(
            (resources.reduce((sum, item) => sum + (item.rating || 0), 0) / totalResources).toFixed(
              2
            )
          )
        : 0;

    return {
      totalResources,
      totalSkills,
      totalWorkflows,
      totalTemplates,
      totalDownloads,
      averageRating,
    };
  }

  @Get('personal-skills')
  @UseGuards(SecureAuthGuard)
  @JwtAuth()
  @ApiOperation({ summary: 'List authenticated user private/personal AI skills' })
  @ApiOkResponse({ type: [PersonalSkillDto] })
  async getPersonalSkills(@Req() req: Request) {
    const userId = this.resolveUserId(req);
    return this.personalSkillsService.listByUser(userId);
  }

  @Get('personal-skills/:id')
  @UseGuards(SecureAuthGuard)
  @JwtAuth()
  @ApiOperation({ summary: 'Get a specific private/personal AI skill for the authenticated user' })
  @ApiOkResponse({ type: PersonalSkillDto })
  async getPersonalSkill(@Param('id') id: string, @Req() req: Request) {
    const userId = this.resolveUserId(req);
    return this.personalSkillsService.getByUser(userId, id);
  }

  @Post('personal-skills')
  @UseGuards(SecureAuthGuard)
  @JwtAuth()
  @ApiOperation({ summary: 'Create a new private/personal AI skill for the authenticated user' })
  @ApiBody({ type: CreatePersonalSkillDto })
  @ApiOkResponse({ type: PersonalSkillDto })
  async createPersonalSkill(@Body() body: CreatePersonalSkillDto, @Req() req: Request) {
    const userId = this.resolveUserId(req);
    return this.personalSkillsService.createByUser(userId, body);
  }

  @Put('personal-skills/:id')
  @UseGuards(SecureAuthGuard)
  @JwtAuth()
  @ApiOperation({ summary: 'Update an authenticated user private/personal AI skill' })
  @ApiBody({ type: UpdatePersonalSkillDto })
  @ApiOkResponse({ type: PersonalSkillDto })
  async updatePersonalSkill(
    @Param('id') id: string,
    @Body() body: UpdatePersonalSkillDto,
    @Req() req: Request
  ) {
    const userId = this.resolveUserId(req);
    return this.personalSkillsService.updateByUser(userId, id, body);
  }

  @Delete('personal-skills/:id')
  @UseGuards(SecureAuthGuard)
  @JwtAuth()
  @ApiOperation({ summary: 'Delete an authenticated user private/personal AI skill' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        id: { type: 'string' },
      },
    },
  })
  async deletePersonalSkill(@Param('id') id: string, @Req() req: Request) {
    const userId = this.resolveUserId(req);
    await this.personalSkillsService.deleteByUser(userId, id);
    return {
      success: true,
      id,
    };
  }

  @Post('search')
  @ApiOperation({
    summary: 'Search resources with optional trait-based narrowing and ranking',
  })
  @ApiExtraModels(
    ResourceDto,
    ResourceSearchMetaDto,
    ResourceSearchEnvelopeDto,
    ResourceSearchRequestDto
  )
  @ApiBody({ type: ResourceSearchRequestDto })
  @ApiOkResponse({
    description:
      'Legacy array response by default. When includeTraitMeta=true, returns an envelope with trait-screen metadata.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: getSchemaPath(ResourceDto) },
        },
        {
          $ref: getSchemaPath(ResourceSearchEnvelopeDto),
        },
      ],
    },
  })
  async searchResources(
    @Body() filter: ResourceSearchRequestDto
  ): Promise<ResourceSearchResponse<ResourceDto>> {
    const resources = await this.getAllResources();
    const includeTraitMeta = Boolean(filter?.includeTraitMeta);
    const { items, meta } = await this.resourceSearchPolicyService.applySearchPolicy(
      resources,
      filter
    );

    if (includeTraitMeta) {
      return {
        items,
        traitScreen: meta,
      };
    }

    return items;
  }

  @Post('search/protocol')
  @ApiOperation({
    summary: 'Protocol envelope search endpoint for NestJS/SGP bridge clients',
  })
  @ApiExtraModels(
    ResourceSearchProtocolRequestEnvelopeDto,
    ResourceSearchProtocolResponseEnvelopeDto,
    ResourceSearchRequestDto,
    ResourceDto,
    ResourceSearchEnvelopeDto
  )
  @ApiBody({
    description:
      'Accepts either RESOURCE.SEARCH.REQUEST envelope or a plain search filter object. Returns RESOURCE.SEARCH.RESPONSE envelope.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ResourceSearchProtocolRequestEnvelopeDto) },
        { $ref: getSchemaPath(ResourceSearchRequestDto) },
      ],
    },
  })
  @ApiOkResponse({
    type: ResourceSearchProtocolResponseEnvelopeDto,
  })
  @ApiBadRequestResponse({
    description:
      "Invalid protocol envelope. For protocol mode, type MUST be 'RESOURCE.SEARCH.REQUEST' and include id/spec/tenant/resource/sent_at/trace/payload.",
  })
  async searchResourcesProtocol(
    @Body() body: unknown
  ): Promise<ResourceSearchProtocolResponseEnvelope<ResourceDto>> {
    const { filter, requestEnvelope } = this.resourceSearchProtocolService.decodeRequest(body);
    const resources = await this.getAllResources();
    const { items, meta } = await this.resourceSearchPolicyService.applySearchPolicy(
      resources,
      filter
    );
    const payload = filter.includeTraitMeta ? { items, traitScreen: meta } : items;

    return this.resourceSearchProtocolService.encodeResponse(requestEnvelope, payload) as any;
  }

  @Post(':id/favorite')
  @UseGuards(SecureAuthGuard)
  @JwtAuth()
  async toggleFavorite(
    @Param('id') resourceId: string,
    @Body() body: { userId?: string },
    @Req() req: Request
  ) {
    const userId = this.resolveUserId(req, body?.userId);
    const result = await this.resourceInteractionService.toggleFavorite(resourceId, userId);
    return {
      success: true,
      resourceId,
      userId,
      favorite: result.favorite,
    };
  }

  @Post('share')
  @UseGuards(SecureAuthGuard)
  @JwtAuth()
  async shareResource(
    @Body() share: { resourceId?: string; fromUserId?: string; toAgentId?: string; notes?: string },
    @Req() req: Request
  ) {
    const resourceId = String(share?.resourceId || '').trim();
    const toAgentId = String(share?.toAgentId || '').trim();
    if (!resourceId) {
      throw new BadRequestException('resourceId is required');
    }
    if (!toAgentId) {
      throw new BadRequestException('toAgentId is required');
    }

    const fromUserId = this.resolveUserId(req, share?.fromUserId);
    const saved = await this.resourceInteractionService.shareResource({
      resourceId,
      fromUserId,
      toAgentId,
      notes: share?.notes,
    });

    return {
      success: true,
      share: saved,
    };
  }
}
