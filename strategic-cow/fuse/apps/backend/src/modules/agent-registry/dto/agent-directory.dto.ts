import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchAgentsDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ description: 'Category filter' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Capability filter' })
  @IsString()
  @IsOptional()
  capability?: string;

  @ApiPropertyOptional({ description: 'Filter verified agents', type: Boolean })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter public agents', type: Boolean })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  publicOnly?: boolean;

  @ApiPropertyOptional({ description: 'Tags filter', type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['rating', 'usageCount', 'lastActiveAt', 'createdAt'] })
  @IsString()
  @IsOptional()
  sortBy?: 'rating' | 'usageCount' | 'lastActiveAt' | 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class AgentDirectoryEntryDto {
  @ApiProperty({ description: 'Agent ID' })
  id: string;

  @ApiProperty({ description: 'Agent display name' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Agent description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Agent category' })
  category?: string;

  @ApiProperty({ description: 'Agent tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Is public' })
  isPublic: boolean;

  @ApiProperty({ description: 'Is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Agent rating' })
  rating: number;

  @ApiProperty({ description: 'Usage count' })
  usageCount: number;

  @ApiProperty({ description: 'Last active timestamp' })
  lastActiveAt: Date;

  @ApiProperty({ description: 'Featured flag' })
  featured: boolean;

  @ApiProperty({ description: 'Agent capabilities', type: [String] })
  capabilities: string[];
}

export class AgentDirectoryResponseDto {
  @ApiProperty({ description: 'Directory entries', type: [AgentDirectoryEntryDto] })
  data: AgentDirectoryEntryDto[];

  @ApiProperty({ description: 'Pagination information' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
