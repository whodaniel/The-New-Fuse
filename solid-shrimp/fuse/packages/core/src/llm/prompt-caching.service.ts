import { Injectable } from '@nestjs/common';

export type AnthropicModel = 'claude-3-5-sonnet-20240620' | 'claude-3-opus-20240229';

export interface PromptParts {
  systemContext: string;
  documentation: string;
  actualQuery: string;
  model: AnthropicModel;
}

export interface CacheControl {
  type: 'ephemeral';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  cache_control?: CacheControl;
}

@Injectable()
export class PromptCachingService {
  public buildCacheablePrompt(parts: PromptParts): Message[] {
    const messages: Message[] = [];

    if (parts.systemContext) {
      messages.push(this.cacheSystemPrompt(parts.systemContext));
    }

    if (parts.documentation) {
      messages.push(this.cacheDocumentation(parts.documentation));
    }

    messages.push(this.buildDynamicQuery(parts.actualQuery));

    return messages;
  }

  public cacheSystemPrompt(systemContext: string): Message {
    return {
      role: 'user',
      content: systemContext,
      cache_control: { type: 'ephemeral' },
    };
  }

  public cacheDocumentation(documentation: string): Message {
    return {
      role: 'user',
      content: documentation,
      cache_control: { type: 'ephemeral' },
    };
  }

  public buildDynamicQuery(actualQuery: string): Message {
    return {
      role: 'user',
      content: actualQuery,
    };
  }
}
