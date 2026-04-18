import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateWorkflowTemplateDto, UpdateWorkflowTemplateDto, WorkflowTemplateResponseDto } from './dto/workflow-template.dto.js';

@Injectable()
export class WorkflowTemplatesService {
  private readonly logger = new Logger(WorkflowTemplatesService.name);
  private templates: Map<string, WorkflowTemplateResponseDto> = new Map();

  constructor() {
    // Initialize with mock templates
    this.initializeMockTemplates();
  }

  private initializeMockTemplates() {
    const mockTemplate: WorkflowTemplateResponseDto = {
      id: 'tmpl_001',
      name: 'Data Processing Pipeline',
      description: 'Template for processing and transforming data',
      category: 'data',
      template: {
        nodes: [
          { id: 'node1', type: 'input', label: 'Data Source' },
          { id: 'node2', type: 'transform', label: 'Transform Data' },
          { id: 'node3', type: 'output', label: 'Save Results' }
        ],
        edges: [
          { from: 'node1', to: 'node2' },
          { from: 'node2', to: 'node3' }
        ]
      },
      tags: ['data', 'etl', 'pipeline'],
      createdBy: 'usr_admin',
      isPublic: true,
      usageCount: 42,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    };

    this.templates.set(mockTemplate.id, mockTemplate);
  }

  async findAll(): Promise<WorkflowTemplateResponseDto[]> {
    this.logger.log('Fetching all workflow templates');
    return Array.from(this.templates.values());
  }

  async findOne(id: string): Promise<WorkflowTemplateResponseDto> {
    this.logger.log(`Fetching workflow template: ${id}`);
    const template = this.templates.get(id);

    if (!template) {
      throw new NotFoundException(`Workflow template with ID ${id} not found`);
    }

    return template;
  }

  async create(createDto: CreateWorkflowTemplateDto, userId: string): Promise<WorkflowTemplateResponseDto> {
    this.logger.log('Creating new workflow template');

    const id = `tmpl_${Date.now()}`;
    const template: WorkflowTemplateResponseDto = {
      id,
      ...createDto,
      createdBy: userId,
      isPublic: createDto.isPublic ?? false,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(id, template);
    return template;
  }

  async update(id: string, updateDto: UpdateWorkflowTemplateDto): Promise<WorkflowTemplateResponseDto> {
    this.logger.log(`Updating workflow template: ${id}`);

    const existingTemplate = this.templates.get(id);
    if (!existingTemplate) {
      throw new NotFoundException(`Workflow template with ID ${id} not found`);
    }

    const updatedTemplate: WorkflowTemplateResponseDto = {
      ...existingTemplate,
      ...updateDto,
      updatedAt: new Date()
    };

    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting workflow template: ${id}`);

    if (!this.templates.has(id)) {
      throw new NotFoundException(`Workflow template with ID ${id} not found`);
    }

    this.templates.delete(id);
  }
}
