import { Module } from '@nestjs/common';
import { MCPBrokerService } from '../../mcp/services/mcp-broker.service.js';
import { ConfigService } from '@nestjs/config';
import { registerProtocolTranslatorTools } from './register-protocol-tools.js';
import { Logger } from '../../utils/logger.js';

/**
 * Module for Protocol Translation Service
 * Integrates the LLM-backed protocol translator with the MCP system
 */
@Module({
  providers: [
    {
      provide: 'PROTOCOL_TRANSLATOR_LOGGER',
      useFactory: () => {
        return new Logger('ProtocolTranslator');
      }
    }
  ],
  exports: []
})
export class ProtocolTranslationModule {
  constructor(
    private readonly mcpBroker: MCPBrokerService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    this.initializeProtocolTranslator();
  }

  /**
   * Initialize the Protocol Translator and register its tools with the MCP server
   */
  private async initializeProtocolTranslator() {
    try {
      const llmApiKey = this.configService.get<string>('OPENAI_API_KEY');
      const llmOrganization = this.configService.get<string>('OPENAI_ORGANIZATION');
      
      if (!llmApiKey) {
        this.logger.warn('OPENAI_API_KEY environment variable is not set. Protocol Translator will not be available.');
        return;
      }
      
      // Register the protocol translator tools with the MCP Broker Service
      registerProtocolTranslatorTools(this.mcpBroker, {
        llmApiKey,
        llmOrganization,
        logger: this.logger,
        cacheEnabled: true
      });
      
      this.logger.info('Protocol Translator tools registered with MCP Broker Service');
    } catch (error) {
      this.logger.error(`Failed to initialize Protocol Translator: ${error.message}`);
    }
  }
}