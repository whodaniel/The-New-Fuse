import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ResourceCategory, ResourceStatus, ResourceType, ResourceVisibility } from '../types/index.js';

export class UpdateResourceDto {
  @ApiPropertyOptional({ description: 'Resource name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Resource description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ResourceCategory, description: 'Resource category' })
  @IsEnum(ResourceCategory)
  @IsOptional()
  category?: ResourceCategory;

  @ApiPropertyOptional({ enum: ResourceType, description: 'Resource type' })
  @IsEnum(ResourceType)
  @IsOptional()
  type?: ResourceType;

  @ApiPropertyOptional({ description: 'Resource content (flexible JSON structure)' })
  @IsObject()
  @IsOptional()
  content?: any;

  @ApiPropertyOptional({ description: 'Resource tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Semantic version (e.g., 1.0.0)' })
  @IsString()
  @IsOptional()
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, {
    message: 'Version must be a valid semantic version (e.g., 1.0.0)',
  })
  version?: string;

  @ApiPropertyOptional({ description: 'Source identifier (file path, URL, repository)' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ enum: ResourceVisibility, description: 'Resource visibility' })
  @IsEnum(ResourceVisibility)
  @IsOptional()
  visibility?: ResourceVisibility;

  @ApiPropertyOptional({ description: 'Resource author' })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({ description: 'Author ID (user or agent)' })
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({ description: 'License identifier' })
  @IsString()
  @IsOptional()
  license?: string;

  @ApiPropertyOptional({ description: 'Homepage URL' })
  @IsString()
  @IsOptional()
  homepage?: string;

  @ApiPropertyOptional({ description: 'Repository URL' })
  @IsString()
  @IsOptional()
  repository?: string;

  @ApiPropertyOptional({ description: 'Keywords for search', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({ enum: ResourceStatus, description: 'Resource status' })
  @IsEnum(ResourceStatus)
  @IsOptional()
  status?: ResourceStatus;

  @ApiPropertyOptional({ description: 'Is verified resource' })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Is featured resource' })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Resource dependencies', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dependencies?: string[];

  @ApiPropertyOptional({ description: 'Related resources', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  relatedResources?: string[];

  @ApiPropertyOptional({ description: 'Extended metadata' })
  @IsObject()
  @IsOptional()
  metadata?: {
    performanceMetrics?: any;
    qualityScore?: number;
    complexityScore?: number;
    estimatedExecutionTime?: number;
    requiredDependencies?: string[];
    optionalDependencies?: string[];
    minimumNodeVersion?: string;
    platforms?: string[];
    configSchema?: any;
  };
}
