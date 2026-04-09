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
