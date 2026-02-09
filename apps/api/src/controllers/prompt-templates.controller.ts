import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { PromptTemplatesService } from '../services/prompt-templates.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('prompt-templates')
export class PromptTemplatesController {
  constructor(private readonly service: PromptTemplatesService) {}

  // Templates
  @Post()
  createTemplate(@Body() data: any) {
    return this.service.createTemplate(data);
  }

  @Get()
  findAllTemplates(@Query() query: any) {
    return this.service.findAllTemplates(query);
  }

  @Get(':id')
  findTemplate(@Param('id') id: string) {
    return this.service.findTemplate(id);
  }

  @Put(':id')
  updateTemplate(@Param('id') id: string, @Body() data: any) {
    return this.service.updateTemplate(id, data);
  }

  @Delete(':id')
  deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }

  // Versions
  @Post(':id/versions')
  createVersion(@Param('id') id: string, @Body() data: any) {
    return this.service.createVersion(id, data);
  }

  @Get(':id/versions')
  getVersions(@Param('id') id: string) {
    return this.service.getVersions(id);
  }

  @Post(':id/compile')
  compileTemplate(@Param('id') id: string, @Body() body: { variables: any }) {
    return this.service.compileTemplate(id, body.variables);
  }

  // Snippets
  @Post('snippets')
  @UseGuards(JwtAuthGuard)
  createSnippet(@Body() data: any) {
    return this.service.createSnippet(data);
  }

  @Get('snippets')
  findAllSnippets(@Query() query: any) {
    return this.service.findAllSnippets(query);
  }

  @Put('snippets/:id')
  @UseGuards(JwtAuthGuard)
  updateSnippet(@Param('id') id: string, @Body() data: any) {
    return this.service.updateSnippet(id, data);
  }

  @Delete('snippets/:id')
  @UseGuards(JwtAuthGuard)
  deleteSnippet(@Param('id') id: string) {
    return this.service.deleteSnippet(id);
  }
}
