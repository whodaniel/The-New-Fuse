import { Injectable } from '@nestjs/common';
import { Logger } from /../utils/logger'';
import { ConfigService } from /@nestjs/config'';
    this.llmProvider = this.configService.get<string>('LLM_PROVIDER', openai';
    this.llmModel = this.configService.get<string>('LLM_MODEL', gpt-4';
      RAG_SYSTEM_PROMPT'
      You are a helpful assistant for The New Fuse platform. Use the provided context to answer the user\'s question. If you don['']
          answer: 'I don/t have enough information to answer that question. Please try asking something else about The New Fuse platform.'
          const source = result.metadata?.source || Unknown';
        .join('')
        answer: 'I/m sorry, I encountered an error while trying to answer your question. Please try again later.'
        case openai'
      const { OpenAI } = await import('openai';
        apiKey: this.configService.get<string>('OPENAI_API_KEY'
          { role: 'system'
          { role: ''
      const { Anthropic } = await import(/@anthropic-ai/sdk';
        apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'
          { role: ''