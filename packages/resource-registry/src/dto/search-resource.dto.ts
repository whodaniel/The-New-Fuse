import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  ResourceCategory,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
} from '../types/index.js';

export class SearchResourceDto {
  @ApiPropertyOptional({ description: 'Search query (searches name, description, tags, keywords)' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({
    enum: ResourceCategory,
    isArray: true,
    description: 'Filter by categories',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ResourceCategory, { each: true })
  category?: ResourceCategory[];

  @ApiPropertyOptional({ enum: ResourceType, isArray: true, description: 'Filter by types' })
  @IsOptional()
  @IsArray()
  @IsEnum(ResourceType, { each: true })
  type?: ResourceType[];

  @ApiPropertyOptional({
    enum: ResourceVisibility,
    isArray: true,
    description: 'Filter by visibility',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ResourceVisibility, { each: true })
  visibility?: ResourceVisibility[];

  @ApiPropertyOptional({ enum: ResourceStatus, isArray: true, description: 'Filter by status' })
  @IsOptional()
  @IsArray()
  @IsEnum(ResourceStatus, { each: true })
  status?: ResourceStatus[];

  @ApiPropertyOptional({ type: [String], description: 'Filter by tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Filter by keywords' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ description: 'Filter by author name' })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({ description: 'Filter verified resources only' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Filter featured resources only' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Minimum version' })
  @IsString()
  @IsOptional()
  minVersion?: string;

  @ApiPropertyOptional({ description: 'Maximum version' })
  @IsString()
  @IsOptional()
  maxVersion?: string;

  @ApiPropertyOptional({ description: 'Created after date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @ApiPropertyOptional({ description: 'Created before date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'createdAt', 'updatedAt', 'usageCount', 'downloadCount', 'favoriteCount'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'downloadCount' | 'favoriteCount';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsString()
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
