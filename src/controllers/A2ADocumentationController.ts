import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { A2AInteractionAnalyzer } from '../services/A2AInteractionAnalyzer.js';
import { A2ASchemaDocumentation } from '../services/A2ASchemaDocumentation.js';
import { A2AAIModelDocumentation } from '../services/A2AAIModelDocumentation.js';

@Controller('documentation')
export class A2ADocumentationController {
    constructor(
        private interactionAnalyzer: A2AInteractionAnalyzer,
        private schemaDoc: A2ASchemaDocumentation,
        private modelDoc: A2AAIModelDocumentation
    ) {}

    @Get('analysis/interactions')
    async getInteractionAnalysis() {
        return await this.interactionAnalyzer.analyzeInteractions();
    }

    @Get('schema/current')
    getCurrentSchema() {
        return this.schemaDoc.getCurrentSchema();
    }

    @Get('schema/:version')
    getSchemaVersion(@Param('version') version: string) {
        return this.schemaDoc.getSchemaVersion(version);
    }

    @Get('models')
    async getAllModels() {
        return await this.modelDoc.getAllModels();
    }

    @Get('models/:modelId')
    async getModelDocumentation(@Param('modelId') modelId: string) {
        return await this.modelDoc.getModelDocumentation(modelId);
    }

    @Post('models/register')
    async registerModel(@Body() model: any) {
        return await this.modelDoc.registerModel(model);
    }

    @Post('models/:modelId/usage')
    async documentModelUsage(
        @Param('modelId') modelId: string,
        @Body() usage: any
    ) {
        usage.modelId = modelId;
        return await this.modelDoc.documentModelUsage(usage);
    }

    @Get('overview')
    getSystemOverview() {
        return {
            name: 'The New Fuse',
            version: '2.0.0',
            description: 'AI/Agent Integration Platform',
            components: [
                {
                    name: 'Agent Communication Protocol',
                    version: '2.0.0',
                    description: 'Message schema and patterns for agent interaction'
                },
                {
                    name: 'AI Model Integration',
                    description: 'AI model management and monitoring'
                },
                {
                    name: 'Analytics & Monitoring',
                    description: 'System metrics and interaction analysis'
                }
            ],
            documentation: {
                schema: '/documentation/schema/current',
                interactions: '/documentation/analysis/interactions',
                models: '/documentation/models'
            }
        };
    }
}