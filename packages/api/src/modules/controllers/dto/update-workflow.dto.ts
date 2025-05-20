import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { UpdateWorkflowDto as IUpdateWorkflowDto } from '@the-new-fuse/types';

export class UpdateWorkflowDto implements IUpdateWorkflowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  steps?: any[];

  @IsOptional()
  @IsString()
  status?: string;
}
