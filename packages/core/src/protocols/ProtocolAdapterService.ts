import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { A2AMessage } from './A2AProtocolHandler.js';

interface ProtocolAdapter {
  name: string;
  version: string;
  canHandle: (protocol: string) => boolean;
  adaptMessage: (message: A2AMessage, targetProtocol: string) => Promise<any>;
}

@Injectable()
export class ProtocolAdapterService {
  private adapters: Map<string, ProtocolAdapter> = new Map();
  private logger = new Logger(ProtocolAdapterService.name);

  registerAdapter(adapter: ProtocolAdapter): void {
    this.adapters.set(adapter.name, adapter);
    this.logger.info(`Registered protocol adapter: ${adapter.name} v${adapter.version}`);
  }

  async adaptMessage(message: A2AMessage, sourceProtocol: string, targetProtocol: string): Promise<any> {
    const adapter = this.findAdapter(sourceProtocol, targetProtocol);
    if (!adapter) {
      throw new Error(`No adapter found for conversion from ${sourceProtocol} to ${targetProtocol}`);
    }

    try {
      return await adapter.adaptMessage(message, targetProtocol);
    } catch (error) {
      this.logger.error(`Failed to adapt message from ${sourceProtocol} to ${targetProtocol}`, error);
      throw error;
    }
  }

  private findAdapter(sourceProtocol: string, targetProtocol: string): ProtocolAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle(sourceProtocol) && adapter.canHandle(targetProtocol)) {
        return adapter;
      }
    }
    return undefined;
  }
}