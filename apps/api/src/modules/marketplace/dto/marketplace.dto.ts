import { AssetType, PricingType } from '@the-new-fuse/marketplace-gateway';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchAssetsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsArray()
  type?: AssetType[];

  @IsOptional()
  @IsArray()
  category?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  category?: string; // Handle single query param case if framework doesn't auto-parse array

  @IsOptional()
  @IsEnum(['popular', 'recent', 'rating', 'price', 'downloads'])
  sort?: 'popular' | 'recent' | 'rating' | 'price' | 'downloads';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}

export class CreateAssetDto {
  @IsString()
  type: AssetType;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  version: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsEnum(['FREE', 'ONE_TIME', 'SUBSCRIPTION', 'PAY_PER_USE', 'REVENUE_SHARE'] as PricingType[])
  pricingType: PricingType;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsString()
  authorId: string;

  // Specific IDs
  @IsOptional()
  @IsString()
  promptTemplateId?: string;

  @IsOptional()
  @IsString()
  agentNftId?: string;

  // Skill Content
  @IsOptional()
  @IsString()
  skillContent?: string;
}
