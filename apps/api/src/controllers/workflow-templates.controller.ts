import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { WorkflowTemplatesService } from '../services/workflow-templates.service';

@Controller('workflow-templates')
export class WorkflowTemplatesController {
  constructor(private readonly templatesService: WorkflowTemplatesService) {}

  @Get()
  async findAll(@User() user: any) {
    return this.templatesService.findAll(user?.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createDto: any, @User() user: any) {
    return this.templatesService.create(createDto, user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateDto: any, @User() user: any) {
    return this.templatesService.update(id, updateDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @User() user: any) {
    return this.templatesService.remove(id, user.userId);
  }
}
