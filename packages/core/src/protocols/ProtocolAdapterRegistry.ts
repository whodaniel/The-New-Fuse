import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { ACAProtocolAdapter } from './adapters/ACAProtocolAdapter.js';
import { GoogleA2AAdapter } from './adapters/GoogleA2AAdapter.js';
import { AnthropicXmlAdapter } from './adapters/AnthropicXmlAdapter.js';

/**
 * Protocol Adapter Registry
 * 
 * This class manages protocol adapters and provides methods for translating
 * messages between different protocols.
 */
@Injectable()
export class ProtocolAdapterRegistry {
  private logger = new Logger(ProtocolAdapterRegistry.name);
  private adapters: Map<string, any> = new Map();

  constructor() {
    // Register built-in adapters
    this.registerAdapter(new ACAProtocolAdapter());
    this.registerAdapter(new GoogleA2AAdapter());
    this.registerAdapter(new AnthropicXmlAdapter());
  }

  /**
   * Register a protocol adapter
   * @param adapter Protocol adapter
   */
  registerAdapter(adapter: any): void {
    this.adapters.set(adapter.name, adapter);
    this.logger.info(`Registered protocol adapter: ${adapter.name} (${adapter.version})`);
  }

  /**
   * Get a protocol adapter by name
   * @param name Adapter name
   * @returns Protocol adapter
   */
  getAdapter(name: string): any {
    return this.adapters.get(name);
  }

  /**
   * Get all registered protocol adapters
   * @returns Array of protocol adapters
   */
  getAllAdapters(): any[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Find an adapter that can handle the given protocol
   * @param protocol Protocol identifier
   * @returns Protocol adapter
   */
  findAdapterForProtocol(protocol: string): any {
    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle(protocol)) {
        return adapter;
      }
    }
    return null;
  }

  /**
   * Translate a message between protocols
   * @param message Message to translate
   * @param sourceProtocol Source protocol
   * @param targetProtocol Target protocol
   * @returns Translated message
   */
  async translateMessage(message: any, sourceProtocol: string, targetProtocol: string): Promise<any> {
    // If source and target protocols are the same, return the message as is
    if (sourceProtocol === targetProtocol) {
      return message;
    }

    // Find adapters for source and target protocols
    const sourceAdapter = this.findAdapterForProtocol(sourceProtocol);
    const targetAdapter = this.findAdapterForProtocol(targetProtocol);

    if (!sourceAdapter) {
      throw new Error(`No adapter found for source protocol: ${sourceProtocol}`);
    }

    if (!targetAdapter) {
      throw new Error(`No adapter found for target protocol: ${targetProtocol}`);
    }

    // If we have a direct adapter that can handle both protocols, use it
    if (sourceAdapter.canHandle(targetProtocol)) {
      return sourceAdapter.adaptMessage(message, targetProtocol);
    }

    // Otherwise, convert to A2A v2.0 as an intermediate format
    const intermediateMessage = await sourceAdapter.adaptMessage(message, 'a2a-v2.0');
    return targetAdapter.adaptMessage(intermediateMessage, targetProtocol);
  }
}
