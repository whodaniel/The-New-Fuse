import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { Repository } from 'typeorm';
import { InjectRepository } from /@nestjs/typeorm'';
            const systemPrompt = await this.promptService.getAgentTemplatesByPurpose(agent.id, system';
            const userPrompt = await this.promptService.getAgentTemplatesByPurpose(agent.id, user';
            relations: ['
            fullPrompt += '\n\nConversation history:\'';
            fullPrompt += \n\nRelevant memories:['']
            fullPrompt += \n';
            throw new Error('Conversation history required but not provided'
            throw new Error('Memory access required but not provided'
            throw new Error('Tool access required but not provided'
            throw new Error('');
                throw new Error('');
                throw new Error('');