// @ts-ignore
// @ts-ignore
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ResourceCatalogItem,
  ResourceCategoryFilter,
  ResourceSearchEnvelope,
  ResourceSearchMeta,
  ResourceSearchRequest,
  ResourceSortBy,
  ResourceTypeFilter,
  TraitConfidence,
} from '@the-new-fuse/types';

export class ResourceSearchRequestDto implements ResourceSearchRequest {
  @ApiPropertyOptional({ description: 'Free-text search string' })
  search?: string;

  @ApiPropertyOptional({
    enum: ['skill', 'workflow', 'template', 'tool', 'integration', 'all'],
    default: 'all',
  })
  type?: ResourceTypeFilter;

  @ApiPropertyOptional({
    enum: [
      'development',
      'productivity',
      'communication',
      'data',
      'automation',
      'ai',
      'other',
      'all',
    ],
    default: 'all',
  })
  category?: ResourceCategoryFilter;

  @ApiPropertyOptional({ type: [String], default: [] })
  tags?: string[];

  @ApiPropertyOptional({ default: false })
  featured?: boolean;

  @ApiPropertyOptional({ enum: ['popular', 'recent', 'rating', 'name'], default: 'popular' })
  sortBy?: ResourceSortBy;

  @ApiPropertyOptional({ description: 'Enable trait screening for this query', default: true })
  traitScreen?: boolean;

  @ApiPropertyOptional({ description: 'Trait-screening candidate limit', minimum: 1 })
  traitLimit?: number;

  @ApiPropertyOptional({ description: 'Trait-screening threshold', minimum: 0, maximum: 1 })
  traitThreshold?: number;

  @ApiPropertyOptional({
    description: 'Return envelope { items, traitScreen } instead of legacy array',
    default: false,
  })
  includeTraitMeta?: boolean;
}

export class ResourceSearchMetaDto implements ResourceSearchMeta {
  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  used!: boolean;

  @ApiProperty({
    nullable: true,
    enum: ['high', 'medium', 'low'],
  })
  confidence!: TraitConfidence | null;

  @ApiProperty({ type: [String] })
  traitFilters!: string[];

  @ApiProperty({ type: [String] })
  requiredAgentIds!: string[];

  @ApiProperty()
  fallbackToBroadSearch!: boolean;

  @ApiProperty()
  beforeTraitCount!: number;

  @ApiProperty()
  afterTraitCount!: number;
}

export class ResourceDto implements ResourceCatalogItem {
  [key: string]: unknown;

  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  author!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  downloads!: number;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  reviews!: number;

  @ApiProperty()
  featured!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiPropertyOptional()
  previewImage?: string;
}

export class ResourceSearchEnvelopeDto implements ResourceSearchEnvelope<ResourceDto> {
  @ApiProperty({ type: [ResourceDto] })
  items!: ResourceDto[];

  @ApiPropertyOptional({ type: ResourceSearchMetaDto })
  traitScreen?: ResourceSearchMetaDto;
}
