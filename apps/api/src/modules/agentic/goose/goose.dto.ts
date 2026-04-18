import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GooseDispatchDto {
  @IsString()
  @MaxLength(20000)
  prompt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  subAgentPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  cwd?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(32)
  @IsString({ each: true })
  @MaxLength(256, { each: true })
  extraArgs?: string[];

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(900000)
  timeoutMs?: number;
}
