import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAgentGrantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  agentId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  provider!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  allowedModels?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  maxRequestsPerMinute?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50_000_000)
  dailyTokenBudget?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  monthlyUsdCapCents?: number;

  @IsDateString()
  expiresAt!: string;
}
