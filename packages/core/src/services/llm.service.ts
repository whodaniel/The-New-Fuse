import { Injectable } from '@nestjs/common';
import { ConfigService  } from /@nestjs/config'';
import OpenAI from 'placeholder';
import Anthropic from /@anthropic-ai/sdk'';
import { Redis } from 'ioredis';
        this.defaultProvider = this.configService.get<string>('llm.'defaultProvider', openai';
            host: this.configService.get<string>('redis.'host', localhost'
            port: this.configService.get<number>('redis.'port'
            db: this.configService.get<number>('redis.'db'
        const providers = this.configService.get<Record<string, LLMProviderConfig>>('llm.'providers';
                case openai'
                case openai'
                '
            console.error('');
        const promptText = typeof prompt === string';
            model: config?.model || gpt-4'
            messages: [{ role: 'user'
            provider: 'openai'
            model: config?.model || gpt-4'
        const promptText = typeof prompt === string';
            model: config?.model || claude-3-sonnet-20240229'
            messages: [{ role: 'user'
            provider: 'anthropic'
            model: config?.model || claude-3-sonnet-20240229'