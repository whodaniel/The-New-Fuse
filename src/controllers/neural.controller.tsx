import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AgentLLMService } from '../services/agent/AgentLLMService.js';
import { MemorySystem } from '../services/memory/MemorySystem.js';
import { PromptService } from '../services/prompt/PromptService.js';
import {
    MemoryContent,
    MemoryQuery,
    PromptTemplate
} from '@the-new-fuse/types';

@ApiTags('Neural')
@Controller('neural')
@UseGuards(JwtAuthGuard)
export class NeuralController {
    constructor(
        private readonly agentService: AgentLLMService,
        private readonly memorySystem: MemorySystem,
        private readonly promptService: PromptService
    ) {}

    @Get('search')
    @ApiOperation({ summary: 'Search memories' })
    @ApiResponse({ status: HttpStatus.OK })
    async searchMemories(@Query() query: MemoryQuery): Promise<any> {
        try {
            const results = await this.memorySystem.search(query);
            return {
                success: true,
                data: results
            };
        } catch(error) {
            throw new HttpException({
                success: false,
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('memory')
    @ApiOperation({ summary: 'Add memory' })
    @ApiResponse({ status: HttpStatus.CREATED })
    async addMemory(@Body() content: MemoryContent): Promise<any> {
        try {
            await this.memorySystem.store(content);
            return {
                success: true,
                message: 'Memory stored successfully'
            };
        } catch(error) {
            throw new HttpException({
                success: false,
                error: error.message
            }, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('memory/batch')
    @ApiOperation({ summary: 'Add multiple memories' })
    @ApiResponse({ status: HttpStatus.CREATED })
    async addMemoryBatch(@Body() body: { memories: MemoryContent[] }): Promise<any> {
        try {
            await this.memorySystem.storeBatch(body.memories);
            return {
                success: true,
                message: 'Memories stored successfully'
            };
        } catch(error) {
            throw new HttpException({
                success: false,
                error: error.message
            }, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('prompt')
    @ApiOperation({ summary: 'Render prompt template' })
    @ApiResponse({ status: HttpStatus.OK })
    async renderPrompt(@Body() body: {
        template: PromptTemplate,
        variables: Record<string, any>
    }): Promise<any> {
        try {
            const renderedPrompt = await this.promptService.render(
                body.template,
                body.variables
            );
            return {
                success: true,
                prompt: renderedPrompt
            };
        } catch(error) {
            throw new HttpException({
                success: false,
                error: error.message
            }, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('generate')
    @ApiOperation({ summary: 'Generate content using LLM' })
    @ApiResponse({ status: HttpStatus.OK })
    async generateContent(@Body() body: {
        prompt: string,
        options?: Record<string, any>
    }): Promise<any> {
        try {
            const response = await this.agentService.generate(
                body.prompt,
                body.options
            );
            return {
                success: true,
                content: response
            };
        } catch(error) {
            throw new HttpException({
                success: false,
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}