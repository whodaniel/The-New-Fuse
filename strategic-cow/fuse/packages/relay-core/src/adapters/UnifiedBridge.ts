
/**
 * Unified Bridge for The New Fuse Framework
 * 
 * Consolidates bridge patterns from:
 * - message-bridge.js (file-based agent coordination)
 * - terminal_bridge.js (AI agent terminal sharing)
 * - agent-bridge.service.js (WebSocket gateway)
 * - vscode-lm-bridge (VSCode language model integration)
 */

import { EventEmitter } from 'events';
import { RelayMessage, Transport } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export class UnifiedBridge extends EventEmitter {
  private logger: Logger;
  private transports: Map<string, Transport> = new Map();

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  addTransport(transport: Transport): void {
    this.transports.set(transport.name, transport);
    transport.onMessage(this.handleMessage.bind(this));
  }

  private handleMessage(message: RelayMessage): void {
    this.emit('message', message);
  }

  async broadcast(message: RelayMessage): Promise<void> {
    for (const transport of this.transports.values()) {
      await transport.send(message);
    }
  }

  async send(message: RelayMessage): Promise<boolean> {
    const targetId = message.target;
    if (!targetId) {
      this.logger.warn('Cannot send message without a target.');
      return false;
    }

    for (const transport of this.transports.values()) {
      if (await transport.send(message)) {
        return true;
      }
    }

    return false;
  }
}
