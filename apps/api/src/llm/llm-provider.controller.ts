import { Controller, Get, Post, Body, Param, Put, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { LLMProviderService, CreateLLMProviderDTO, LLMProviderDTO } from './llm-provider.service.js';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('llm')
@Controller('api/llm/providers')
export class LLMProviderController {
  constructor(private readonly llmProviderService: LLMProviderService) {}

  @Get()
  @ApiOperation({ summary: 'Get all LLM providers' })
  @ApiResponse({ status: 200, description: 'Returns all available LLM providers' })
  async findAll(): Promise<LLMProviderDTO[]> {
    try {
      return await this.llmProviderService.findAll();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch LLM providers: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new LLM provider' })
  @ApiBody({ type: CreateLLMProviderDTO })
  @ApiResponse({ status: 201, description: 'The LLM provider has been successfully created' })
  async create(@Body() createLLMProviderDto: CreateLLMProviderDTO): Promise<LLMProviderDTO> {
    try {
      return await this.llmProviderService.create(createLLMProviderDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create LLM provider: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an LLM provider by ID' })
  @ApiResponse({ status: 200, description: 'Returns the LLM provider' })
  @ApiResponse({ status: 404, description: 'LLM provider not found' })
  async findOne(@Param('id') id: string): Promise<LLMProviderDTO> {
    try {
      return await this.llmProviderService.findById(id);
    } catch (error) {
      throw new HttpException(
        `Failed to find LLM provider: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an LLM provider' })
  @ApiResponse({ status: 200, description: 'The LLM provider has been successfully updated' })
  async update(
    @Param('id') id: string,
    @Body() updateLLMProviderDto: Partial<CreateLLMProviderDTO>
  ): Promise<LLMProviderDTO> {
    try {
      return await this.llmProviderService.update(id, updateLLMProviderDto);
    } catch (error) {
      throw new HttpException(
        `Failed to update LLM provider: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an LLM provider' })
  @ApiResponse({ status: 200, description: 'The LLM provider has been successfully deleted' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      await this.llmProviderService.delete(id);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        `Failed to delete LLM provider: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/default')
  @ApiOperation({ summary: 'Set an LLM provider as default' })
  @ApiResponse({ status: 200, description: 'The LLM provider has been set as default' })
  async setDefault(@Param('id') id: string): Promise<LLMProviderDTO> {
    try {
      return await this.llmProviderService.setDefault(id);
    } catch (error) {
      throw new HttpException(
        `Failed to set LLM provider as default: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}