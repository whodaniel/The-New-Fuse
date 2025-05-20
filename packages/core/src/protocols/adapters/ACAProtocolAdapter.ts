import { Injectable } from '@nestjs/common';
import { Logger } from '../../utils/logger.js';
import { A2AMessage, A2AMessageContent } from '../A2AProtocolHandler.js';

/**
 * ACA (Agent Communication Architecture) Message Context
 */
interface ACAMessageContext {
  timestamp: number;
  timeoutMs?: number;
  retryCount?: number;
  traceId?: string;
  capabilities?: string[];
  securityContext?: {
    authType: string;
    token?: string;
    encryption?: boolean;
  };
}

/**
 * ACA (Agent Communication Architecture) Message Format
 */
interface ACAMessage {
  header: {
    messageId: string;
    messageType: string;
    protocolVersion: string;
    priority: string;
    sourceAgentId: string;
    targetAgentId?: string;
    conversationId?: string;
  };
  payload: {
    data: A2AMessageContent;
    context: ACAMessageContext;
  };
}

/**
 * ACA Protocol Adapter
 * 
 * This adapter implements the ACA (Agent Communication Architecture) protocol,
 * which is the primary protocol for AI Agent-to-AI Agent communication across
 * environments and platforms.
 */
@Injectable()
export class ACAProtocolAdapter {
  private logger = new Logger(ACAProtocolAdapter.name);

  readonly name = 'aca-protocol-adapter';
  readonly version = '1.0.0';
  readonly supportedProtocols = ['a2a-v2.0', 'aca-v1.0'];

  /**
   * Check if this adapter can handle the given protocol
   * @param protocol Protocol identifier
   * @returns True if the adapter can handle the protocol
   */
  canHandle(protocol: string): boolean {
    return this.supportedProtocols.includes(protocol);
  }

  /**
   * Adapt a message between protocols
   * @param message Message to adapt
   * @param targetProtocol Target protocol
   * @returns Adapted message
   */
  async adaptMessage(message: A2AMessage, targetProtocol: string): Promise<ACAMessage | A2AMessage> {
    if (targetProtocol === 'aca-v1.0') {
      return this.convertToACAFormat(message);
    } else if (targetProtocol === 'a2a-v2.0') {
      return this.convertFromACAFormat(message as unknown as ACAMessage);
    }
    throw new Error(`Unsupported target protocol: ${targetProtocol}`);
  }

  /**
   * Convert a standard A2A message to ACA format
   * @param message A2A message
   * @returns ACA message
   */
  private convertToACAFormat(message: A2AMessage): ACAMessage {
    return {
      header: {
        messageId: message.header.id,
        messageType: message.header.type,
        protocolVersion: 'v1.0',
        priority: message.header.priority.toUpperCase(),
        sourceAgentId: message.header.source,
        targetAgentId: message.header.target,
        conversationId: message.body.metadata.trace_id,
      },
      payload: {
        data: message.body.content,
        context: {
          timestamp: message.body.metadata.sent_at,
          timeoutMs: message.body.metadata.timeout,
          retryCount: message.body.metadata.retries,
          traceId: message.body.metadata.trace_id,
          securityContext: {
            authType: 'none',
            encryption: false,
          },
        },
      },
    };
  }

  /**
   * Convert an ACA message to standard A2A format
   * @param message ACA message
   * @returns A2A message
   */
  private convertFromACAFormat(message: ACAMessage): A2AMessage {
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
          trace_id: message.header.conversationId || message.payload.context.traceId,
        },
      },
    };
  }
}
