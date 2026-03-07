import { IsString, IsOptional, IsArray, IsEnum, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import type { UpdateWorkflowDefinitionDto } from '@the-new-fuse/types';

export class UpdateWorkflowDto implements UpdateWorkflowDefinitionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['manual', 'event', 'schedule'])
  triggerType?: 'manual' | 'event' | 'schedule';

  @IsOptional()
  @IsObject()
  triggerConfig?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  steps?: any[];

  @IsOptional()
  @IsObject()
  initialContext?: Record<string, any>;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
