import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  WorkflowTemplateResponseDto,
} from './dto/workflow-template.dto';
import { WorkflowTemplatesService } from './workflow-templates.service';

@ApiTags('workflows')
@Controller('workflows/templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowTemplatesController {
  constructor(private readonly workflowTemplatesService: WorkflowTemplatesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all workflow templates',
    description: 'Retrieve a list of all available workflow templates',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    type: [WorkflowTemplateResponseDto],
  })
  async findAll(): Promise<WorkflowTemplateResponseDto[]> {
    return this.workflowTemplatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get workflow template by ID',
    description: 'Retrieve a specific workflow template by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
    type: WorkflowTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(@Param('id') id: string): Promise<WorkflowTemplateResponseDto> {
    return this.workflowTemplatesService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create workflow template',
    description: 'Create a new workflow template',
  })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: WorkflowTemplateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createDto: CreateWorkflowTemplateDto,
    @Req() req: any
  ): Promise<WorkflowTemplateResponseDto> {
    const userId = req.user?.id || 'usr_default';
    return this.workflowTemplatesService.create(createDto, userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update workflow template',
    description: 'Update an existing workflow template',
  })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    type: WorkflowTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkflowTemplateDto
  ): Promise<WorkflowTemplateResponseDto> {
    return this.workflowTemplatesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete workflow template',
    description: 'Delete a workflow template by ID',
  })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.workflowTemplatesService.delete(id);
  }
}
