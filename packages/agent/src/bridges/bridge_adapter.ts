/**
 * Bridge Adapter - Adapts different bridge interfaces to a common format
 *
 * Provides translation layer between different bridge implementations,
 * allowing agents to communicate across different protocols seamlessly.
 */

import { EventEmitter } from 'events';

import { MessageType, Priority } from './index';

import type { BaseBridge } from './index';

// ============================================================
// ADAPTER TYPES
// ============================================================

export interface AdaptedMessage {
  originalFormat: string;
  adaptedFormat: string;
  sourceId: string;
  targetId: string;
  content: unknown;
  metadata: Record<string, unknown>;
}

export interface BridgeAdapterConfig {
  sourceBridge: string;
  targetBridge: string;
  transformations?: Array<{
    field: string;
    transform: (value: unknown) => unknown;
  }>;
}

// ============================================================
// BRIDGE ADAPTER
// ============================================================

export class BridgeAdapter extends EventEmitter {
  private bridges: Map<string, BaseBridge> = new Map();
  private adapters: Map<string, BridgeAdapterConfig> = new Map();
  private messageQueue: AdaptedMessage[] = [];
  private processing = false;

  constructor() {
    super();
  }

  /**
   * Register a bridge
   */
  registerBridge(name: string, bridge: BaseBridge): void {
    this.bridges.set(name, bridge);

    // Forward messages to adapter
    bridge.on('message', (message) => {
      this.handleBridgeMessage(name, message);
    });

    this.emit('bridge:registered', { name });
  }

  /**
   * Unregister a bridge
   */
  unregisterBridge(name: string): void {
    this.bridges.delete(name);
    this.emit('bridge:unregistered', { name });
  }

  /**
   * Create an adapter between two bridges
   */
  createAdapter(config: BridgeAdapterConfig): void {
    const key = `${config.sourceBridge}:${config.targetBridge}`;
    this.adapters.set(key, config);
    this.emit('adapter:created', { key });
  }

  /**
   * Remove an adapter
   */
  removeAdapter(sourceBridge: string, targetBridge: string): void {
    const key = `${sourceBridge}:${targetBridge}`;
    this.adapters.delete(key);
    this.emit('adapter:removed', { key });
  }

  /**
   * Route a message from one bridge to another
   */
  async routeMessage(sourceBridge: string, targetBridge: string, message: unknown): Promise<void> {
    const source = this.bridges.get(sourceBridge);
    const target = this.bridges.get(targetBridge);

    if (!source || !target) {
      throw new Error(`Bridge not found: ${!source ? sourceBridge : targetBridge}`);
    }

    const adapterKey = `${sourceBridge}:${targetBridge}`;
    const adapter = this.adapters.get(adapterKey);

    // Transform message if adapter exists
    let transformedMessage = message;
    if (adapter && adapter.transformations) {
      transformedMessage = this.applyTransformations(message, adapter.transformations);
    }

    const adaptedMessage: AdaptedMessage = {
      originalFormat: sourceBridge,
      adaptedFormat: targetBridge,
      sourceId: sourceBridge,
      targetId: targetBridge,
      content: transformedMessage,
      metadata: { timestamp: new Date() },
    };

    this.messageQueue.push(adaptedMessage);
    await this.processQueue();
  }

  /**
   * Broadcast message to all bridges
   */
  async broadcastMessage(
    sourceBridge: string,
    message: unknown,
    excludeBridges: string[] = []
  ): Promise<void> {
    for (const [name, bridge] of this.bridges) {
      if (name !== sourceBridge && !excludeBridges.includes(name)) {
        await this.routeMessage(sourceBridge, name, message);
      }
    }
  }

  /**
   * Handle incoming message from a bridge
   */
  private async handleBridgeMessage(bridgeName: string, message: unknown): Promise<void> {
    this.emit('message:received', { bridge: bridgeName, message });

    // Check for adapters that route from this bridge
    for (const [key, adapter] of this.adapters) {
      if (adapter.sourceBridge === bridgeName) {
        await this.routeMessage(bridgeName, adapter.targetBridge, message);
      }
    }
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          const targetBridge = this.bridges.get(message.targetId);
          if (targetBridge) {
            await targetBridge.sendMessage(
              message.content as Record<string, unknown>,
              MessageType.COMMAND,
              Priority.MEDIUM
            );
            this.emit('message:routed', message);
          }
        } catch (error) {
          this.emit('error', { message, error });
        }
      }
    }

    this.processing = false;
  }

  /**
   * Apply transformations to a message
   */
  private applyTransformations(
    message: unknown,
    transformations: Array<{
      field: string;
      transform: (value: unknown) => unknown;
    }>
  ): unknown {
    if (typeof message !== 'object' || message === null) {
      return message;
    }

    const result = { ...(message as Record<string, unknown>) };

    for (const { field, transform } of transformations) {
      if (field in result) {
        result[field] = transform(result[field]);
      }
    }

    return result;
  }

  /**
   * Get all registered bridges
   */
  getBridges(): string[] {
    return Array.from(this.bridges.keys());
  }

  /**
   * Get all adapters
   */
  getAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get adapter statistics
   */
  getStats(): {
    bridges: number;
    adapters: number;
    queueLength: number;
    processing: boolean;
  } {
    return {
      bridges: this.bridges.size,
      adapters: this.adapters.size,
      queueLength: this.messageQueue.length,
      processing: this.processing,
    };
  }
}

export default BridgeAdapter;
