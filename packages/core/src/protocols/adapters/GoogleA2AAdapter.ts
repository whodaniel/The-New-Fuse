import { Injectable } from '@nestjs/common';
import { Logger } from '../../utils/logger.js';
import { A2AMessage, A2AMessageContent } from '../A2AProtocolHandler.js';

interface GoogleA2AMessageContext {
  timestamp: number;
  timeoutMs?: number;
  retryCount?: number;
  traceId?: string;
  capabilities?: string[];
}

interface GoogleA2AMessage {
  header: {
    messageId: string;
    messageType: string;
    protocolVersion: string;
    priority: string;
    sourceAgentId: string;
    targetAgentId?: string;
  };
  payload: {
    data: A2AMessageContent;
    context: GoogleA2AMessageContext;
  };
}

@Injectable()
export class GoogleA2AAdapter {
  private logger = new Logger(GoogleA2AAdapter.name);

  readonly name = 'google-a2a-adapter';
  readonly version = '1.0.0';
  readonly supportedProtocols = ['a2a-v2.0', 'google-a2a-v1.0'];

  canHandle(protocol: string): boolean {
    return this.supportedProtocols.includes(protocol);
  }

  async adaptMessage(message: A2AMessage, targetProtocol: string): Promise<GoogleA2AMessage> {
    if (targetProtocol === 'google-a2a-v1.0') {
      return this.convertToGoogleFormat(message);
    } else if (targetProtocol === 'a2a-v2.0') {
      return this.convertFromGoogleFormat(message as unknown as GoogleA2AMessage);
    }
    throw new Error(`Unsupported target protocol: ${targetProtocol}`);
  }

  private convertToGoogleFormat(message: A2AMessage): GoogleA2AMessage {
    return {
      header: {
        messageId: message.header.id,
        messageType: message.header.type,
        protocolVersion: 'v1.0',
        priority: message.header.priority.toUpperCase(),
        sourceAgentId: message.header.source,
        targetAgentId: message.header.target,
      },
      payload: {
        data: message.body.content,
        context: {
          timestamp: message.body.metadata.sent_at,
          timeoutMs: message.body.metadata.timeout,
          retryCount: message.body.metadata.retries,
          traceId: message.body.metadata.trace_id,
        },
      },
    };
  }

  private convertFromGoogleFormat(message: GoogleA2AMessage): A2AMessage {
    return {
      header: {
        id: message.header.messageId,
        type: message.header.messageType,
        version: message.header.protocolVersion,
        priority: message.header.priority.toLowerCase() as 'low' | 'medium' | 'high',
        source: message.header.sourceAgentId,
        target: message.header.targetAgentId,
      },
      body: {
        content: message.payload.data,
        metadata: {
          sent_at: message.payload.context.timestamp,
          timeout: message.payload.context.timeoutMs,
          retries: message.payload.context.retryCount,
          trace_id: message.payload.context.traceId,
        },
      },
    };
  }
}