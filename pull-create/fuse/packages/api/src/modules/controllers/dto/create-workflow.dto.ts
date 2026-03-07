import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import type { CreateWorkflowDefinitionDto } from '@the-new-fuse/types';

export class CreateWorkflowDto implements CreateWorkflowDefinitionDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['manual', 'event', 'schedule'])
  triggerType: 'manual' | 'event' | 'schedule' = 'manual';

  @IsOptional()
  @IsObject()
  triggerConfig?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  steps: any[] = [];

  @IsOptional()
  @IsObject()
  initialContext?: Record<string, any>;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
