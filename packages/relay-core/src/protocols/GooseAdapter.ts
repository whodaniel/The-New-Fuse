/**
 * Goose Protocol Adapter
 *
 * Bridges Goose CLI/headless interaction envelopes to TNF A2A relay messages.
 */

import { ProtocolType, RelayMessage } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
import { ProtocolAdapter } from './ProtocolAdapter.js';

export class GooseAdapter implements ProtocolAdapter {
  public readonly name = 'goose-cli';
  public readonly version = '1.0.0';
  public readonly supportedProtocols: ProtocolType[] = ['goose-cli-v1.0', 'a2a-v2.0'];

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
    if (sourceProtocol === 'goose-cli-v1.0' && targetProtocol === 'a2a-v2.0') {
      return this.gooseToA2A(message);
    }
    if (sourceProtocol === 'a2a-v2.0' && targetProtocol === 'goose-cli-v1.0') {
      return this.a2aToGoose(message);
    }

    throw new Error(`Unsupported translation: ${sourceProtocol} -> ${targetProtocol}`);
  }

  private gooseToA2A(message: RelayMessage): RelayMessage {
    const payload = message.payload || {};
    const event = String(payload.event || payload.type || payload.action || '').toLowerCase();

    if (event === 'tool_call' || event === 'tool') {
      return this.withMetadata(
        message,
        {
          ...message,
          type: 'FUNCTION_CALL',
          payload: {
            function: payload.toolName || payload.name,
            parameters: payload.arguments || payload.params || {},
            callId: payload.callId || payload.id,
            traceId: payload.traceId || payload.sessionId,
          },
        },
        'a2a-v2.0'
      );
    }

    if (event === 'tool_result' || event === 'tool_response') {
      return this.withMetadata(
        message,
        {
          ...message,
          type: 'TOOL_RESPONSE',
          payload: {
            success: payload.success !== false,
            result: payload.result ?? payload.output ?? null,
            error: payload.error,
            callId: payload.callId || payload.id,
          },
        },
        'a2a-v2.0'
      );
    }

    if (event === 'status' || event === 'agent_status') {
      return this.withMetadata(
        message,
        {
          ...message,
          type: 'AGENT_STATUS',
          payload: {
            status: payload.status || 'running',
            step: payload.step || payload.stage,
            detail: payload.detail || payload.message || '',
          },
        },
        'a2a-v2.0'
      );
    }

    return this.withMetadata(
      message,
      {
        ...message,
        type: 'ASSISTANT_MESSAGE',
        payload: {
          content: payload.content || payload.message || '',
          role: payload.role || 'assistant',
          artifacts: payload.artifacts || [],
        },
      },
      'a2a-v2.0'
    );
  }

  private a2aToGoose(message: RelayMessage): RelayMessage {
    const payload = message.payload || {};

    if (message.type === 'FUNCTION_CALL') {
      return this.withMetadata(
        message,
        {
          ...message,
          payload: {
            event: 'tool_call',
            toolName: payload.function,
            arguments: payload.parameters || {},
            callId: payload.callId || payload.toolCallId,
          },
        },
        'goose-cli-v1.0'
      );
    }

    if (message.type === 'TOOL_RESPONSE') {
      return this.withMetadata(
        message,
        {
          ...message,
          payload: {
            event: 'tool_result',
            success: payload.success !== false,
            result: payload.result ?? null,
            error: payload.error,
            callId: payload.callId || payload.toolCallId,
          },
        },
        'goose-cli-v1.0'
      );
    }

    if (message.type === 'AGENT_STATUS') {
      return this.withMetadata(
        message,
        {
          ...message,
          payload: {
            event: 'status',
            status: payload.status || 'running',
            stage: payload.step || payload.stage,
            detail: payload.detail || '',
          },
        },
        'goose-cli-v1.0'
      );
    }

    if (!payload.content && !payload.message) {
      this.logger.debug('Translating generic A2A payload into Goose message envelope');
    }

    return this.withMetadata(
      message,
      {
        ...message,
        payload: {
          event: 'message',
          role: payload.role || 'assistant',
          message: payload.content || payload.message || '',
        },
      },
      'goose-cli-v1.0'
    );
  }

  private withMetadata(
    message: RelayMessage,
    translated: RelayMessage,
    protocol: ProtocolType
  ): RelayMessage {
    return {
      ...translated,
      metadata: {
        ...(message.metadata || {}),
        protocol,
        originalProtocol: message.metadata?.protocol || null,
        translatedAt: new Date().toISOString(),
      },
    };
  }
}
