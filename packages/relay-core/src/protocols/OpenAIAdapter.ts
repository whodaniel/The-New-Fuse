/**
 * OpenAI Protocol Adapter
 *
 * Handles OpenAI's Assistant API and function calling format
 * Converts between OpenAI format and The New Fuse's A2A protocol
 */

import { ProtocolType, RelayMessage } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
import { ProtocolAdapter } from './ProtocolAdapter.js';

export class OpenAIAdapter implements ProtocolAdapter {
  public readonly name = 'openai-assistant';
  public readonly version = '1.0.0';
  public readonly supportedProtocols: ProtocolType[] = ['openai-assistant-v1.0', 'a2a-v2.0'];

  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  canTranslate(from: ProtocolType, to: ProtocolType): boolean {
    return this.supportedProtocols.includes(from) && this.supportedProtocols.includes(to);
  }

  async translate(
    message: RelayMessage,
    sourceProtocol: ProtocolType,
    targetProtocol: ProtocolType
  ): Promise<RelayMessage> {
    if (sourceProtocol === 'openai-assistant-v1.0' && targetProtocol === 'a2a-v2.0') {
      return this.openaiToA2A(message);
    } else if (sourceProtocol === 'a2a-v2.0' && targetProtocol === 'openai-assistant-v1.0') {
      return this.a2aToOpenAI(message);
    }

    throw new Error(`Unsupported translation: ${sourceProtocol} -> ${targetProtocol}`);
  }

  private openaiToA2A(message: RelayMessage): RelayMessage {
    const { payload } = message;

    // Handle OpenAI function calls
    if (this.isOpenAIFunctionCall(payload)) {
      return {
        ...message,
        type: 'FUNCTION_CALL',
        payload: {
          function: payload.function_call?.name || payload.tool_calls?.[0]?.function?.name,
          parameters: this.parseOpenAIFunctionParameters(payload),
          reasoning: payload.reasoning || '',
          toolCallId: payload.tool_calls?.[0]?.id,
        },
        metadata: {
          ...message.metadata,
          protocol: 'a2a-v2.0',
          originalProtocol: 'openai-assistant-v1.0',
          translatedAt: new Date().toISOString(),
        },
      };
    }

    // Handle OpenAI assistant messages
    if (this.isOpenAIAssistantMessage(payload)) {
      return {
        ...message,
        type: 'ASSISTANT_MESSAGE',
        payload: {
          content: this.extractOpenAIContent(payload),
          role: payload.role,
          assistantId: payload.assistant_id,
          threadId: payload.thread_id,
          runId: payload.run_id,
          annotations: payload.annotations || [],
        },
        metadata: {
          ...message.metadata,
          protocol: 'a2a-v2.0',
          originalProtocol: 'openai-assistant-v1.0',
          translatedAt: new Date().toISOString(),
        },
      };
    }

    // Handle OpenAI tool outputs
    if (this.isOpenAIToolOutput(payload)) {
      return {
        ...message,
        type: 'TOOL_RESPONSE',
        payload: {
          result: payload.output,
          success: !payload.error,
          toolCallId: payload.tool_call_id,
          metadata: {
            runId: payload.run_id,
            threadId: payload.thread_id,
          },
        },
        metadata: {
          ...message.metadata,
          protocol: 'a2a-v2.0',
          originalProtocol: 'openai-assistant-v1.0',
          translatedAt: new Date().toISOString(),
        },
      };
    }

    // Generic OpenAI message
    return {
      ...message,
      payload: {
        content: payload.content || payload.message || payload,
        role: payload.role || 'user',
        metadata: this.extractOpenAIMetadata(payload),
      },
      metadata: {
        ...message.metadata,
        protocol: 'a2a-v2.0',
        originalProtocol: 'openai-assistant-v1.0',
        translatedAt: new Date().toISOString(),
      },
    };
  }

  private a2aToOpenAI(message: RelayMessage): RelayMessage {
    const { payload } = message;

    // Convert A2A function call to OpenAI format
    if (message.type === 'FUNCTION_CALL') {
      return {
        ...message,
        payload: this.createOpenAIFunctionCall(payload),
        metadata: {
          ...message.metadata,
          protocol: 'openai-assistant-v1.0',
          originalProtocol: 'a2a-v2.0',
          translatedAt: new Date().toISOString(),
        },
      };
    }

    // Convert A2A tool response to OpenAI format
    if (message.type === 'TOOL_RESPONSE') {
      return {
        ...message,
        payload: this.createOpenAIToolOutput(payload),
        metadata: {
          ...message.metadata,
          protocol: 'openai-assistant-v1.0',
          originalProtocol: 'a2a-v2.0',
          translatedAt: new Date().toISOString(),
        },
      };
    }

    // Convert A2A assistant message to OpenAI format
    if (message.type === 'ASSISTANT_MESSAGE') {
      return {
        ...message,
        payload: this.createOpenAIAssistantMessage(payload),
        metadata: {
          ...message.metadata,
          protocol: 'openai-assistant-v1.0',
          originalProtocol: 'a2a-v2.0',
          translatedAt: new Date().toISOString(),
        },
      };
    }

    // Generic A2A to OpenAI conversion
    return {
      ...message,
      payload: this.createOpenAIMessage(payload),
      metadata: {
        ...message.metadata,
        protocol: 'openai-assistant-v1.0',
        originalProtocol: 'a2a-v2.0',
        translatedAt: new Date().toISOString(),
      },
    };
  }

  // OpenAI format detection helpers
  private isOpenAIFunctionCall(payload: any): boolean {
    return !!(payload.function_call || payload.tool_calls);
  }

  private isOpenAIAssistantMessage(payload: any): boolean {
    return !!(payload.role && (payload.assistant_id || payload.thread_id));
  }

  private isOpenAIToolOutput(payload: any): boolean {
    return !!(payload.tool_call_id && payload.output !== undefined);
  }

  // OpenAI parsing helpers
  private parseOpenAIFunctionParameters(payload: any): any {
    if (payload.function_call?.arguments) {
      try {
        return JSON.parse(payload.function_call.arguments);
      } catch {
        return { raw: payload.function_call.arguments };
      }
    }

    if (payload.tool_calls?.[0]?.function?.arguments) {
      try {
        return JSON.parse(payload.tool_calls[0].function.arguments);
      } catch {
        return { raw: payload.tool_calls[0].function.arguments };
      }
    }

    return {};
  }

  private extractOpenAIContent(payload: any): string {
    if (typeof payload.content === 'string') {
      return payload.content;
    }

    if (Array.isArray(payload.content)) {
      return payload.content.map((item: any) => item.text?.value || item.text || item).join('\n');
    }

    return payload.message || payload.text || '';
  }

  private extractOpenAIMetadata(payload: any): any {
    return {
      model: payload.model,
      assistantId: payload.assistant_id,
      threadId: payload.thread_id,
      runId: payload.run_id,
      messageId: payload.id,
      createdAt: payload.created_at,
      role: payload.role,
      usage: payload.usage,
    };
  }

  // OpenAI format generation helpers
  private createOpenAIFunctionCall(payload: any): any {
    const functionCall = {
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: payload.toolCallId || `call_${Date.now()}`,
          type: 'function',
          function: {
            name: payload.function,
            arguments: JSON.stringify(payload.parameters || {}),
          },
        },
      ],
    };

    if (payload.reasoning) {
      functionCall.content = payload.reasoning;
    }

    return functionCall;
  }

  private createOpenAIToolOutput(payload: any): any {
    return {
      tool_call_id: payload.toolCallId,
      output: typeof payload.result === 'object' ? JSON.stringify(payload.result) : payload.result,
      run_id: payload.metadata?.runId,
      thread_id: payload.metadata?.threadId,
      error: payload.success === false ? 'Tool execution failed' : undefined,
    };
  }

  private createOpenAIAssistantMessage(payload: any): any {
    return {
      role: payload.role || 'assistant',
      content: payload.content,
      assistant_id: payload.assistantId,
      thread_id: payload.threadId,
      run_id: payload.runId,
      annotations: payload.annotations || [],
      metadata: payload.metadata || {},
    };
  }

  private createOpenAIMessage(payload: any): any {
    return {
      role: payload.role || 'user',
      content: payload.content || payload.message || payload,
      metadata: payload.metadata || {},
    };
  }
}
