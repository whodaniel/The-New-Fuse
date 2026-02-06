import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class WorkflowStepDto {
  @ApiProperty()
  @IsString()
  id: string = '';

  @ApiProperty()
  @IsString()
  type: string = '';

  @ApiProperty()
  @IsObject()
  config: Record<string, any> = {};

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  nextSteps: string[] = [];
}

export class CreateWorkflowDto {
  @ApiProperty()
  @IsString()
  name: string = '';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[] = [];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateWorkflowDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [WorkflowStepDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  @IsOptional()
  steps?: WorkflowStepDto[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class WorkflowResponseDto {
  @ApiProperty()
  id: string = '';

  @ApiProperty()
  name: string = '';

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ type: [WorkflowStepDto] })
  steps: WorkflowStepDto[] = [];

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date = new Date();

  @ApiProperty()
  updatedAt: Date = new Date();
}
