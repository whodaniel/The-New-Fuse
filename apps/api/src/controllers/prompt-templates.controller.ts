import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PromptTemplatesService } from '../services/prompt-templates.service';

@Controller('prompt-templates')
export class PromptTemplatesController {
  constructor(private readonly service: PromptTemplatesService) {}

  // Templates
  @Post()
  createTemplate(@Body() data: any): Promise<any> {
    return this.service.createTemplate(data);
  }

  @Get()
  findAllTemplates(@Query() query: any): Promise<any> {
    return this.service.findAllTemplates(query);
  }

  @Get(':id')
  findTemplate(@Param('id') id: string): Promise<any> {
    return this.service.findTemplate(id);
  }

  @Put(':id')
  updateTemplate(@Param('id') id: string, @Body() data: any): Promise<any> {
    return this.service.updateTemplate(id, data);
  }

  @Delete(':id')
  deleteTemplate(@Param('id') id: string): Promise<any> {
    return this.service.deleteTemplate(id);
  }

  // Versions
  @Post(':id/versions')
  createVersion(@Param('id') id: string, @Body() data: any): Promise<any> {
    return this.service.createVersion(id, data);
  }

  @Get(':id/versions')
  getVersions(@Param('id') id: string): Promise<any> {
    return this.service.getVersions(id);
  }

  @Post(':id/compile')
  compileTemplate(@Param('id') id: string, @Body() body: { variables: any }): Promise<any> {
    return this.service.compileTemplate(id, body.variables);
  }

  // Snippets
  @Post('snippets')
  @UseGuards(JwtAuthGuard)
  createSnippet(@Body() data: any): Promise<any> {
    return this.service.createSnippet(data);
  }

  @Get('snippets')
  findAllSnippets(@Query() query: any): Promise<any> {
    return this.service.findAllSnippets(query);
  }

  @Put('snippets/:id')
  @UseGuards(JwtAuthGuard)
  updateSnippet(@Param('id') id: string, @Body() data: any): Promise<any> {
    return this.service.updateSnippet(id, data);
  }

  @Delete('snippets/:id')
  @UseGuards(JwtAuthGuard)
  deleteSnippet(@Param('id') id: string): Promise<any> {
    return this.service.deleteSnippet(id);
  }
}
