
/**
 * Protocol Translator for The New Fuse Relay System
 */

import { EventEmitter } from 'events';
import { RelayMessage, ProtocolType, ProtocolAdapter } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export class ProtocolTranslator extends EventEmitter {
  private logger: Logger;
  private adapters: Map<string, ProtocolAdapter> = new Map();

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  registerAdapter(adapter: ProtocolAdapter): void {
    this.adapters.set(adapter.name, adapter);
    this.logger.info(`Registered protocol adapter: ${adapter.name}`);
  }

  async translate(
    message: RelayMessage,
    targetProtocol: ProtocolType
  ): Promise<RelayMessage> {
    const sourceProtocol = message.metadata?.protocol as ProtocolType;

    if (!sourceProtocol || sourceProtocol === targetProtocol) {
      return message;
    }

    const adapter = this.findAdapter(sourceProtocol, targetProtocol);

    if (adapter) {
      return adapter.translate(message, sourceProtocol, targetProtocol);
    } else {
      this.logger.warn(
        `No direct adapter found from ${sourceProtocol} to ${targetProtocol}. Attempting multi-step translation.`
      );
      // Attempt to find a path through a common protocol (e.g., A2A)
      // This is a simplified example. A real implementation would need a more robust graph traversal algorithm.
      const a2aAdapter = this.findAdapter(sourceProtocol, 'a2a-v2.0');
      const a2aToTargetAdapter = this.findAdapter(
        'a2a-v2.0',
        targetProtocol
      );

      if (a2aAdapter && a2aToTargetAdapter) {
        const intermediateMessage = await a2aAdapter.translate(
          message,
          sourceProtocol,
          'a2a-v2.0'
        );
        return a2aToTargetAdapter.translate(intermediateMessage, 'a2a-v2.0', targetProtocol);
      }
    }

    this.logger.error(`Could not find translation path from ${sourceProtocol} to ${targetProtocol}`);
    return message; // Or throw an error
  }

  private findAdapter(
    source: ProtocolType,
    target: ProtocolType
  ): ProtocolAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.canTranslate(source, target)) {
        return adapter;
      }
    }
    return undefined;
  }
}
