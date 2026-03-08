import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AdminOnly } from '../../guards/secure-auth.guard';
import { MarketplaceService } from './marketplace.service';
import {
  MarketplaceCatalogQuery,
  MarketplaceCatalogSubmissionInput,
  MarketplaceExperienceSubmissionInput,
  MarketplacePublicationStatus,
} from './marketplace.types';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('catalog')
  async getCatalog(@Query() query: MarketplaceCatalogQuery) {
    return await this.marketplaceService.getCatalog(query);
  }

  @Get('experiences')
  async getExperiences(@Query() query: MarketplaceCatalogQuery) {
    return await this.marketplaceService.getExperiences(query);
  }

  @Get('catalog/:id')
  async getCatalogItem(@Param('id') id: string) {
    const item = await this.marketplaceService.getItemById(id);
    if (!item) {
      throw new NotFoundException(`Catalog item not found: ${id}`);
    }
    return item;
  }

  @Get('research/counts')
  async getResearchCounts() {
    return await this.marketplaceService.getResearchCounts();
  }

  @Get('research/prompts')
  async searchResearchPrompts(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return await this.marketplaceService.searchResearchPrompts({
      q,
      limit: Number(limit),
      offset: Number(offset),
    });
  }

  @Get('research/sources')
  async getResearchSources(@Query('limitPerCategory') limitPerCategory?: string) {
    return await this.marketplaceService.getResearchSources({
      limitPerCategory: Number(limitPerCategory) || 8,
    });
  }

  @Get('research/skills/counts')
  async getResearchSkillCounts() {
    return await this.marketplaceService.getResearchSkillCounts();
  }

  @Get('research/skills/sources')
  async getResearchSkillSources(@Query('limitPerCategory') limitPerCategory?: string) {
    return await this.marketplaceService.getResearchSkillSources({
      limitPerCategory: Number(limitPerCategory) || 8,
    });
  }

  @Get('research/skills/files')
  async searchResearchSkillFiles(
    @Query('q') q?: string,
    @Query('sourceId') sourceId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return await this.marketplaceService.searchResearchSkillFiles({
      q,
      sourceId: Number(sourceId),
      limit: Number(limit),
      offset: Number(offset),
    });
  }

  @Get('research/skills/marketplace/counts')
  async getResearchSkillMarketplaceCounts() {
    return await this.marketplaceService.getResearchSkillMarketplaceCounts();
  }

  @Get('research/skills/marketplace/entries')
  async listResearchSkillMarketplaceEntries(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return await this.marketplaceService.listResearchSkillMarketplaceEntries({
      q,
      limit: Number(limit),
      offset: Number(offset),
    });
  }

  @Get('research/mcp/counts')
  async getResearchMcpCounts() {
    return await this.marketplaceService.getResearchMcpCounts();
  }

  @Get('research/mcp/sources')
  async getResearchMcpSources(@Query('limitPerCategory') limitPerCategory?: string) {
    return await this.marketplaceService.getResearchMcpSources({
      limitPerCategory: Number(limitPerCategory) || 8,
    });
  }

  @Get('research/mcp/servers')
  async searchResearchMcpServers(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return await this.marketplaceService.searchResearchMcpServers({
      q,
      limit: Number(limit),
      offset: Number(offset),
    });
  }

  @Post('research/crawl/run')
  async triggerResearchCrawl(
    @Body()
    body: {
      command?: string;
      dryRun?: boolean;
    }
  ) {
    return await this.marketplaceService.triggerResearchCrawl(body || {});
  }

  @Get('research/crawl/runs')
  async listResearchCrawlRuns(@Query('limit') limit?: string) {
    return await this.marketplaceService.listResearchCrawlRuns(Number(limit) || 20);
  }

  @Get('research/crawl/runs/:id')
  async getResearchCrawlRun(@Param('id') id: string) {
    return await this.marketplaceService.getResearchCrawlRun(id);
  }

  @Post('experiences/submit')
  submitExperience(
    @Body()
    body: MarketplaceExperienceSubmissionInput
  ) {
    return this.marketplaceService.submitExperience(body);
  }

  @Post('catalog/submit')
  submitCatalogItem(
    @Body()
    body: MarketplaceCatalogSubmissionInput
  ) {
    return this.marketplaceService.submitCatalogItem(body);
  }

  @Post('catalog/:id/publication-status')
  @AdminOnly()
  async transitionPublicationStatus(
    @Param('id') id: string,
    @Body()
    body: {
      toStatus: MarketplacePublicationStatus;
      moderatedBy?: string;
    }
  ) {
    try {
      if (!body.toStatus) {
        throw new BadRequestException('toStatus is required');
      }

      const item = await this.marketplaceService.transitionPublicationStatus({
        id,
        toStatus: body.toStatus,
        moderatedBy: body.moderatedBy,
      });
      if (!item) {
        throw new NotFoundException(`Catalog item not found: ${id}`);
      }
      return item;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException((error as Error).message);
    }
  }
}
