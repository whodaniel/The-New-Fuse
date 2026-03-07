import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { MarketplaceCatalogItem } from '../marketplace/marketplace.types';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

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

  @Post('search')
  async searchResources(@Body() filter: any) {
    const resources = await this.getAllResources();
    const search = String(filter?.search || '').toLowerCase();
    const type = String(filter?.type || 'all');
    const category = String(filter?.category || 'all');
    const tags = Array.isArray(filter?.tags)
      ? filter.tags.map((tag: string) => tag.toLowerCase())
      : [];
    const featured = Boolean(filter?.featured);
    const sortBy = String(filter?.sortBy || 'popular');

    let filtered = resources.filter((item) => {
      if (search) {
        const haystack = [item.name, item.description, ...(item.tags || [])]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (type !== 'all' && item.type !== type) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (
        tags.length > 0 &&
        !(item.tags || []).some((tag: string) => tags.includes(tag.toLowerCase()))
      ) {
        return false;
      }
      if (featured && !item.featured) return false;

      return true;
    });

    filtered = filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return (b.downloads || 0) - (a.downloads || 0);
    });

    return filtered;
  }

  @Post(':id/favorite')
  toggleFavorite(@Param('id') id: string, @Body() body: { userId: string }) {
    return { success: true };
  }

  @Post('share')
  shareResource(@Body() share: any) {
    return { success: true };
  }
}
