import type { UpdateWorkflowDefinitionDto } from '@the-new-fuse/types';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

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
