import { Controller, Get, Post, Body, Param, Put, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { LLMProviderService, CreateLLMProviderDTO, LLMProviderDTO } from './llm-provider.service';
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
        `Failed to fetch LLM providers: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new LLM provider' })
  @ApiBody({ description: 'LLM Provider creation data' })
  @ApiResponse({ status: 201, description: 'The LLM provider has been successfully created' })
  async create(@Body() createLLMProviderDto: CreateLLMProviderDTO): Promise<LLMProviderDTO> {
    try {
      return await this.llmProviderService.create(createLLMProviderDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create LLM provider: ${(error as Error).message}`,
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
        `Failed to find LLM provider: ${(error as Error).message}`,
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
        `Failed to update LLM provider: ${(error as Error).message}`,
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
        `Failed to delete LLM provider: ${(error as Error).message}`,
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
        `Failed to set LLM provider as default: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('register-claude-code-cli')
  @ApiOperation({ summary: 'Register Claude Code CLI as local LLM provider' })
  @ApiResponse({ status: 201, description: 'Claude Code CLI has been successfully registered' })
  @ApiResponse({ status: 404, description: 'Claude Code CLI not available on this system' })
  async registerClaudeCodeCLI(): Promise<{ success: boolean; provider?: LLMProviderDTO; message: string }> {
    try {
      const provider = await this.llmProviderService.registerClaudeCodeCLI();
      
      if (!provider) {
        return {
          success: false,
          message: 'Claude Code CLI is not available on this system. Please ensure it is installed and accessible.'
        };
      }

      return {
        success: true,
        provider,
        message: 'Claude Code CLI has been successfully registered as a local LLM provider'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to register Claude Code CLI: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('register-gemini-cli')
  @ApiOperation({ summary: 'Register Gemini CLI as local LLM provider' })
  @ApiResponse({ status: 201, description: 'Gemini CLI has been successfully registered' })
  @ApiResponse({ status: 404, description: 'Gemini CLI not available on this system' })
  async registerGeminiCLI(): Promise<{ success: boolean; provider?: LLMProviderDTO; message: string }> {
    try {
      const provider = await this.llmProviderService.registerGeminiCLI();
      
      if (!provider) {
        return {
          success: false,
          message: 'Gemini CLI is not available on this system. Please ensure it is installed and accessible.'
        };
      }

      return {
        success: true,
        provider,
        message: 'Gemini CLI has been successfully registered as a local LLM provider'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to register Gemini CLI: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}