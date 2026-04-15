
/**
 * Message Router for The New Fuse Relay System
 */

import { EventEmitter } from 'events';
import { RelayMessage, Transport } from '../types/index.js';
import { AgentRegistry } from './AgentRegistry.js';
import { Logger } from './Logger.js';

export class MessageRouter extends EventEmitter {
  private logger: Logger;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  async route(
    message: RelayMessage,
    transports: Map<string, Transport>,
    agentRegistry: AgentRegistry
  ): Promise<boolean> {
    const targetId = message.target;

    if (!targetId) {
      this.logger.warn('Cannot route message without a target.');
      return false;
    }

    // Find the transport for the target agent
    const agent = agentRegistry.getAgent(targetId);
    if (agent && agent.metadata?.transport) {
      const transport = transports.get(agent.metadata.transport);
      if (transport) {
        return transport.send(message);
      }
    }

    // If no specific transport is found, try to send to all
    for (const transport of transports.values()) {
      if (await transport.send(message)) {
        this.emit('messageRouted', message);
        return true;
      }
    }

    this.logger.warn(`Could not find a transport to route message to ${targetId}`);
    return false;
  }
}
