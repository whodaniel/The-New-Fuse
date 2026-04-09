import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class TraitScreenRequestDto {
  @ApiProperty({
    description: 'Natural-language request to screen against agent/skill traits',
    example: 'Need an agent that can ingest markdown docs and run SEO analysis',
  })
  @IsString()
  @IsNotEmpty()
  inquiry: string;

  @ApiPropertyOptional({
    description: 'Maximum number of candidate agents to return',
    default: 5,
    minimum: 1,
    maximum: 25,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(25)
  limit?: number = 5;

  @ApiPropertyOptional({
    description: 'Minimum similarity score for matches (0-1)',
    default: 0.45,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  threshold?: number = 0.45;

  @ApiPropertyOptional({
    description: 'Restrict results to system agents only',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  onlySystem?: boolean = false;

  @ApiPropertyOptional({
    description: 'Optional access-level filter (superadmin/admin/dev/user/guest)',
    type: [String],
    default: [],
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  includeAccessLevels?: string[] = [];

  @ApiPropertyOptional({
    description: 'Include top matching chunks in response payload',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeChunks?: boolean = true;
}
