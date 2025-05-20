import { Injectable } from '@nestjs/common';
import { Logger } from '../../utils/logger.js';
import { MCPMessage } from '../../types/mcp.js';
import { ProtocolAdapterRegistry } from '../../protocols/ProtocolAdapterRegistry.js';

@Injectable()
export class ProtocolTranslatorService {
  private logger = new Logger(ProtocolTranslatorService.name);

  constructor(private readonly adapterRegistry: ProtocolAdapterRegistry) {}

  /**
   * Translate a message between protocols
   * @param message Message to translate
   * @param sourceProtocol Source protocol
   * @param targetProtocol Target protocol
   * @returns Translated message
   */
  async translateMessage(
    message: unknown,
    sourceProtocol: string,
    targetProtocol: string
  ): Promise<any> {
    try {
      return await this.adapterRegistry.translateMessage(
        message,
        sourceProtocol,
        targetProtocol
      );
    } catch (error) {
      this.logger.error(`Error translating message: ${error.message}`);
      throw new Error(`Failed to translate message: ${error.message}`);
    }
  }

  /**
   * Validate protocol compliance
   * @param message Message to validate
   * @param protocol Protocol to validate against
   * @returns Validation result
   */
  async validateProtocolCompliance(
    message: unknown,
    protocol: string
  ): Promise<any> {
    try {
      const adapter = this.adapterRegistry.findAdapterForProtocol(protocol);

      if (!adapter) {
        throw new Error(`No adapter found for protocol: ${protocol}`);
      }

      // If the adapter has a validate method, use it
      if (typeof adapter.validate === 'function') {
        return await adapter.validate(message);
      }

      // Otherwise, try to adapt the message to the protocol and back
      // If it succeeds, the message is valid
      const adaptedMessage = await adapter.adaptMessage(message, protocol);
      return { valid: true, message: adaptedMessage };
    } catch (error) {
      this.logger.error(`Error validating protocol compliance: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }
}