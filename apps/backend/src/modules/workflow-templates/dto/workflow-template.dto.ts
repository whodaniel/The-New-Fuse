import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkflowTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Customer Onboarding Flow',
    maxLength: 200
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Template description',
    example: 'Automated workflow for onboarding new customers',
    maxLength: 1000
  })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({
    description: 'Category/type of workflow',
    example: 'automation'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Template configuration/definition',
    example: {
      nodes: [
        { id: 'node1', type: 'trigger', config: {} },
        { id: 'node2', type: 'action', config: {} }
      ],
      edges: [{ from: 'node1', to: 'node2' }]
    }
  })
  @IsNotEmpty({ message: 'Template configuration is required' })
  @IsObject()
  template: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    example: ['automation', 'customer', 'onboarding']
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether template is publicly available',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateWorkflowTemplateDto {
  @ApiPropertyOptional({
    description: 'Template name',
    example: 'Updated Customer Onboarding Flow'
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Template description',
    example: 'Updated automated workflow for onboarding'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Category/type of workflow',
    example: 'automation'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Template configuration/definition'
  })
  @IsOptional()
  @IsObject()
  template?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    example: ['automation', 'customer']
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether template is publicly available'
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class WorkflowTemplateResponseDto {
  @ApiProperty({ example: 'tmpl_123456' })
  id: string;

  @ApiProperty({ example: 'Customer Onboarding Flow' })
  name: string;

  @ApiProperty({ example: 'Automated workflow for onboarding new customers' })
  description: string;

  @ApiPropertyOptional({ example: 'automation' })
  category?: string;

  @ApiProperty({
    description: 'Template configuration',
    example: {
      nodes: [],
      edges: []
    }
  })
  template: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Template tags',
    example: ['automation', 'customer']
  })
  tags?: string[];

  @ApiProperty({ example: 'usr_123' })
  createdBy: string;

  @ApiProperty({ example: false })
  isPublic: boolean;

  @ApiProperty({ example: 25 })
  usageCount: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
