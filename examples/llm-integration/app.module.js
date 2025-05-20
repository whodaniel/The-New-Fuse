"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
import common_1 from '@nestjs/common';
import config_1 from '@nestjs/config';
import typeorm_1 from '@nestjs/typeorm';
import agent_workflow_1 from './agent-workflow.js';
import llm_service_1 from '@the-new-fuse/core/services/llm.service';
import prompt_service_1 from '@the-new-fuse/core/services/prompt.service';
import agent_llm_service_1 from '@the-new-fuse/core/services/agent-llm.service';
import agent_entity_1 from '@the-new-fuse/core/entities/agent.entity';
import prompt_entity_1 from '@the-new-fuse/core/entities/prompt.entity';
import agent_prompt_entity_1 from '@the-new-fuse/core/entities/agent-prompt.entity';
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [() => ({
                        llm: {
                            defaultProvider: 'openai',
                            providers: {
                                openai: {
                                    apiKey: process.env.OPENAI_API_KEY,
                                    model: 'gpt-4',
                                    baseUrl: 'https://api.openai.com/v1'
                                },
                                anthropic: {
                                    apiKey: process.env.ANTHROPIC_API_KEY,
                                    model: 'claude-3'
                                }
                            },
                            cacheTTL: 3600
                        },
                        redis: {
                            host: 'localhost',
                            port: 6379,
                            db: 0
                        }
                    })]
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5432,
                username: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'the_new_fuse',
                entities: [agent_entity_1.Agent, prompt_entity_1.PromptTemplate, agent_prompt_entity_1.AgentPromptTemplate],
                synchronize: true
            }),
            typeorm_1.TypeOrmModule.forFeature([agent_entity_1.Agent, prompt_entity_1.PromptTemplate, agent_prompt_entity_1.AgentPromptTemplate])
        ],
        providers: [
            llm_service_1.LLMService,
            prompt_service_1.PromptService,
            agent_llm_service_1.AgentLLMService,
            agent_workflow_1.AgentWorkflowExample
        ],
        exports: [agent_workflow_1.AgentWorkflowExample]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map