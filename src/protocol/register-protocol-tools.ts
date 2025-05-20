import { MCPBrokerService } from '../../mcp/services/mcp-broker.service.js';
import { MCPProtocolServer } from './MCPProtocolServer.js';
import { Logger } from '../utils/logger.js';
import { ProtocolType } from './llm-protocol-translator.js';

/**
 * Configuration options for protocol translator registration
 */
interface ProtocolTranslatorConfig {
  llmApiKey: string;
  llmOrganization?: string;
  logger?: Logger;
  cacheEnabled?: boolean;
}

/**
 * Register protocol translator tools with the MCP broker service
 * 
 * This makes the translation capabilities available to all agents in the system
 */
export function registerProtocolTranslatorTools(
  mcpBroker: MCPBrokerService,
  config: ProtocolTranslatorConfig
): void {
  const logger = config.logger || new Logger('ProtocolTranslator');
  
  logger.info('Initializing Protocol Translator MCP Server');
  
  // Create Protocol Server instance
  const protocolServer = new MCPProtocolServer({
    llmApiKey: config.llmApiKey,
    llmOrganization: config.llmOrganization,
    logger: logger
  });
  
  // Register the protocol server with the MCP broker
  mcpBroker.registerServer('protocol', protocolServer);
  
  logger.info('Protocol Translator registered with the following capabilities:');
  logger.info(`- Protocol Translation: Translate between different agent protocols`);
  logger.info(`- Supported protocols: ${Object.values(ProtocolType).join(', ')}`);
  logger.info(`- Dynamic Translation: Translate between previously unknown protocols`);
  
  // Set up event listeners for monitoring
  protocolServer.on('messageTranslated', (data) => {
    logger.debug(`Message translated from ${data.sourceProtocol} to ${data.targetProtocol}`);
  });
  
  protocolServer.on('toolTranslated', (data) => {
    logger.debug(`Tool translated from ${data.sourceProtocol} to ${data.targetProtocol}`);
  });
  
  protocolServer.on('capabilityTranslated', (data) => {
    logger.debug(`Capability translated from ${data.sourceProtocol} to ${data.targetProtocol}`);
  });
  
  protocolServer.on('protocolLearned', (data) => {
    logger.info(`Learned new protocol: ${data.name}`);
  });
}