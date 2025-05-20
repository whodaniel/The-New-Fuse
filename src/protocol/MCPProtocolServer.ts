import { Injectable } from '@nestjs/common';
import { MCPServer } from '../mcp/MCPServer.js';
import { LLMProtocolTranslator, ProtocolBridge, ProtocolType } from './llm-protocol-translator.js';
import { Logger } from '../utils/logger.js';

/**
 * MCP Protocol Translation Server
 * 
 * Provides protocol translation capabilities through the MCP interface
 */
@Injectable()
export class MCPProtocolServer extends MCPServer {
  private protocolBridge: ProtocolBridge;
  private logger: Logger;

  constructor(config: { 
    llmApiKey: string, 
    llmOrganization?: string,
    logger?: Logger
  }) {
    super({
      capabilities: {
        // Define high-level capabilities
        protocolTranslation: {
          description: 'Translate between different agent protocol formats using AI',
          actions: ['translateMessage', 'translateTool', 'translateCapability', 'learnProtocol']
        },
        protocolDiscovery: {
          description: 'Discover and retrieve information about available protocols',
          actions: ['listProtocols', 'getProtocolSchema', 'updateProtocolInformation']
        },
        dynamicTranslation: {
          description: 'Dynamically translate between previously unknown protocols',
          actions: ['dynamicTranslate']
        }
      },
      tools: {
        // Protocol translation tools
        translateMessage: {
          description: 'Translate a message from one protocol format to another',
          parameters: {
            message: {
              type: 'object',
              description: 'The message to translate'
            },
            sourceProtocol: {
              type: 'string',
              description: 'Source protocol format',
              enum: Object.values(ProtocolType)
            },
            targetProtocol: {
              type: 'string',
              description: 'Target protocol format',
              enum: Object.values(ProtocolType)
            }
          },
          handler: async (params: any, context: any) => {
            this.logger.info(`Translating message from ${params.sourceProtocol} to ${params.targetProtocol}`);
            try {
              const result = await this.protocolBridge.translateMessage(
                params.message,
                params.sourceProtocol as ProtocolType,
                params.targetProtocol as ProtocolType
              );
              return {
                success: true,
                translatedMessage: result,
                sourceProtocol: params.sourceProtocol,
                targetProtocol: params.targetProtocol
              };
            } catch (error: any) {
              this.logger.error(`Error translating message: ${error.message}`);
              return {
                success: false,
                error: error.message,
                sourceProtocol: params.sourceProtocol,
                targetProtocol: params.targetProtocol
              };
            }
          }
        },
        
        translateTool: {
          description: 'Translate a tool definition from one protocol format to another',
          parameters: {
            tool: {
              type: 'object',
              description: 'The tool definition to translate'
            },
            sourceProtocol: {
              type: 'string',
              description: 'Source protocol format',
              enum: Object.values(ProtocolType)
            },
            targetProtocol: {
              type: 'string',
              description: 'Target protocol format',
              enum: Object.values(ProtocolType)
            }
          },
          handler: async (params: any, context: any) => {
            this.logger.info(`Translating tool from ${params.sourceProtocol} to ${params.targetProtocol}`);
            try {
              const result = await this.protocolBridge.translateTool(
                params.tool,
                params.sourceProtocol as ProtocolType,
                params.targetProtocol as ProtocolType
              );
              return {
                success: true,
                translatedTool: result,
                sourceProtocol: params.sourceProtocol,
                targetProtocol: params.targetProtocol
              };
            } catch (error: any) {
              this.logger.error(`Error translating tool: ${error.message}`);
              return {
                success: false,
                error: error.message,
                sourceProtocol: params.sourceProtocol,
                targetProtocol: params.targetProtocol
              };
            }
          }
        },
        
        translateCapability: {
          description: 'Translate a capability definition from one protocol format to another',
          parameters: {
            capability: {
              type: 'object',
              description: 'The capability definition to translate'
            },
            sourceProtocol: {
              type: 'string',
              description: 'Source protocol format',
              enum: Object.values(ProtocolType)
            },
            targetProtocol: {
              type: 'string',
              description: 'Target protocol format',
              enum: Object.values(ProtocolType)
            }
          },
          handler: async (params: any, context: any) => {
            this.logger.info(`Translating capability from ${params.sourceProtocol} to ${params.targetProtocol}`);
            try {
              const result = await this.protocolBridge.translateCapability(
                params.capability,
                params.sourceProtocol as ProtocolType,
                params.targetProtocol as ProtocolType
              );
              return {
                success: true,
                translatedCapability: result,
                sourceProtocol: params.sourceProtocol,
                targetProtocol: params.targetProtocol
              };
            } catch (error: any) {
              this.logger.error(`Error translating capability: ${error.message}`);
              return {
                success: false,
                error: error.message,
                sourceProtocol: params.sourceProtocol,
                targetProtocol: params.targetProtocol
              };
            }
          }
        },
        
        learnCustomProtocol: {
          description: 'Teach the translator about a new custom protocol based on examples',
          parameters: {
            protocolName: {
              type: 'string',
              description: 'Name of the custom protocol to learn'
            },
            messageExamples: {
              type: 'array',
              description: 'Examples of messages in the custom protocol',
              items: {
                type: 'object',
                properties: {
                  sample: {
                    type: 'object',
                    description: 'Sample message in the custom protocol format'
                  },
                  explanation: {
                    type: 'string',
                    description: 'Explanation of the message format'
                  }
                }
              }
            },
            capabilityExamples: {
              type: 'array',
              description: 'Examples of capabilities in the custom protocol',
              items: {
                type: 'object',
                properties: {
                  sample: {
                    type: 'object',
                    description: 'Sample capability in the custom protocol format'
                  },
                  explanation: {
                    type: 'string',
                    description: 'Explanation of the capability format'
                  }
                }
              }
            },
            toolExamples: {
              type: 'array',
              description: 'Examples of tools in the custom protocol',
              items: {
                type: 'object',
                properties: {
                  sample: {
                    type: 'object',
                    description: 'Sample tool in the custom protocol format'
                  },
                  explanation: {
                    type: 'string',
                    description: 'Explanation of the tool format'
                  }
                }
              }
            }
          },
          handler: async (params: any, context: any) => {
            this.logger.info(`Learning custom protocol: ${params.protocolName}`);
            try {
              await this.protocolBridge.learnCustomProtocol(params.protocolName, {
                messages: params.messageExamples,
                capabilities: params.capabilityExamples,
                tools: params.toolExamples
              });
              return {
                success: true,
                protocolName: params.protocolName,
                message: `Successfully learned protocol: ${params.protocolName}`
              };
            } catch (error: any) {
              this.logger.error(`Error learning custom protocol: ${error.message}`);
              return {
                success: false,
                error: error.message,
                protocolName: params.protocolName
              };
            }
          }
        },
        
        listProtocols: {
          description: 'List all available protocols in the system',
          parameters: {},
          handler: async () => {
            return {
              protocols: Object.values(ProtocolType),
              description: 'List of all available protocols in the system'
            };
          }
        },
        
        updateProtocolInfo: {
          description: 'Update protocol information from the web',
          parameters: {
            protocol: {
              type: 'string',
              description: 'The protocol to update information for',
              enum: Object.values(ProtocolType)
            }
          },
          handler: async (params: any) => {
            this.logger.info(`Updating protocol information for: ${params.protocol}`);
            try {
              await this.protocolBridge.updateProtocolInformation(params.protocol as ProtocolType);
              return {
                success: true,
                protocol: params.protocol,
                message: `Successfully updated protocol information for ${params.protocol}`
              };
            } catch (error: any) {
              this.logger.error(`Error updating protocol information: ${error.message}`);
              return {
                success: false,
                error: error.message,
                protocol: params.protocol
              };
            }
          }
        },
        
        dynamicTranslate: {
          description: 'Dynamically translate between protocols based on descriptions and examples',
          parameters: {
            source: {
              type: 'object',
              description: 'The source data to translate'
            },
            sourceProtocolInfo: {
              type: 'object',
              description: 'Information about the source protocol',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the source protocol'
                },
                description: {
                  type: 'string',
                  description: 'Description of the source protocol'
                },
                examples: {
                  type: 'array',
                  description: 'Examples of the source protocol format',
                  items: {
                    type: 'object'
                  }
                }
              },
              required: ['name', 'description']
            },
            targetProtocolInfo: {
              type: 'object',
              description: 'Information about the target protocol',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the target protocol'
                },
                description: {
                  type: 'string',
                  description: 'Description of the target protocol'
                },
                examples: {
                  type: 'array',
                  description: 'Examples of the target protocol format',
                  items: {
                    type: 'object'
                  }
                }
              },
              required: ['name', 'description']
            }
          },
          handler: async (params: any) => {
            this.logger.info(`Dynamic translation from ${params.sourceProtocolInfo.name} to ${params.targetProtocolInfo.name}`);
            try {
              const result = await this.protocolBridge.dynamicTranslate(
                params.source,
                params.sourceProtocolInfo,
                params.targetProtocolInfo
              );
              return {
                success: true,
                translatedData: result,
                sourceProtocol: params.sourceProtocolInfo.name,
                targetProtocol: params.targetProtocolInfo.name
              };
            } catch (error: any) {
              this.logger.error(`Error during dynamic translation: ${error.message}`);
              return {
                success: false,
                error: error.message,
                sourceProtocol: params.sourceProtocolInfo.name,
                targetProtocol: params.targetProtocolInfo.name
              };
            }
          }
        }
      }
    });
    
    this.logger = config.logger || new Logger('MCPProtocolServer');
    
    // Initialize Protocol Bridge
    this.protocolBridge = new ProtocolBridge({
      llmApiKey: config.llmApiKey,
      llmOrganization: config.llmOrganization,
      logger: this.logger,
      cacheEnabled: true
    });
    
    // Set up event listeners
    this.protocolBridge.on('messageTranslated', (data) => {
      this.logger.info(`Translated message from ${data.sourceProtocol} to ${data.targetProtocol}`);
      this.emit('messageTranslated', data);
    });
    
    this.protocolBridge.on('capabilityTranslated', (data) => {
      this.logger.info(`Translated capability from ${data.sourceProtocol} to ${data.targetProtocol}`);
      this.emit('capabilityTranslated', data);
    });
    
    this.protocolBridge.on('toolTranslated', (data) => {
      this.logger.info(`Translated tool from ${data.sourceProtocol} to ${data.targetProtocol}`);
      this.emit('toolTranslated', data);
    });
    
    this.protocolBridge.on('protocolLearned', (data) => {
      this.logger.info(`Learned new protocol: ${data.name}`);
      this.emit('protocolLearned', data);
    });
  }
}