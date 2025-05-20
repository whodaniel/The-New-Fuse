import { EventEmitter } from 'events';

// Base interface for all protocol messages
export interface ProtocolMessage {
  [key: string]: any;
}

// Protocol types we can support
export enum ProtocolType {
  A2A_V1 = 'a2a-v1.0',
  A2A_V2 = 'a2a-v2.0',
  MCP = 'mcp-v1.0',
  GOOGLE_A2A = 'google-a2a-v1.0',
  ANTHROPIC_MCP = 'anthropic-mcp-v1.0',
  ANTHROPIC_XML = 'anthropic-xml-v1.0',
  OPENAI_ASSISTANT = 'openai-assistant-v1.0',
  LANGCHAIN = 'langchain-v1.0',
  AUTOGEN = 'autogen-v1.0',
  CREWAI = 'crewai-v1.0',
  PYDANTIC = 'pydantic-v1.0'
}

// Protocol capabilities
export interface ProtocolCapability {
  id: string;
  name: string;
  description: string;
  version: string;
  actions: ProtocolAction[];
}

// Protocol action
export interface ProtocolAction {
  id: string;
  name: string;
  description: string;
  parameters: ProtocolParameter[];
  returns: ProtocolReturns;
}

// Protocol parameter
export interface ProtocolParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: any;
}

// Protocol returns
export interface ProtocolReturns {
  type: string;
  properties?: Record<string, any>;
}

// Protocol adapter interface
export interface ProtocolAdapter {
  name: string;
  version: string;
  supportedProtocols: ProtocolType[];
  canHandle(protocol: ProtocolType): boolean;
  adaptMessage(message: ProtocolMessage, sourceProtocol: ProtocolType, targetProtocol: ProtocolType): Promise<ProtocolMessage>;
  adaptCapability(capability: ProtocolCapability, sourceProtocol: ProtocolType, targetProtocol: ProtocolType): Promise<any>;
  adaptTool(tool: any, sourceProtocol: ProtocolType, targetProtocol: ProtocolType): Promise<any>;
}

/**
 * Protocol Translator Service
 *
 * Translates messages and capabilities between different protocols
 */
export class ProtocolTranslator extends EventEmitter {
  private adapters: Map<string, ProtocolAdapter> = new Map();
  private logger: any;

  constructor(logger: any) {
    super();
    this.logger = logger || console;
  }

  /**
   * Register a protocol adapter
   */
  registerAdapter(adapter: ProtocolAdapter): void {
    this.adapters.set(adapter.name, adapter);
    this.logger.info(`Registered protocol adapter: ${adapter.name} v${adapter.version}`);
  }

  /**
   * Get all registered adapters
   */
  getAdapters(): ProtocolAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Find an adapter that can handle the specified protocols
   */
  private findAdapter(sourceProtocol: ProtocolType, targetProtocol: ProtocolType): ProtocolAdapter | null {
    for (const adapter of this.adapters.values()) {
      if (
        adapter.supportedProtocols.includes(sourceProtocol) &&
        adapter.supportedProtocols.includes(targetProtocol)
      ) {
        return adapter;
      }
    }
    return null;
  }

  /**
   * Translate a message from one protocol to another
   */
  async translateMessage(
    message: ProtocolMessage,
    sourceProtocol: ProtocolType,
    targetProtocol: ProtocolType
  ): Promise<ProtocolMessage> {
    if (sourceProtocol === targetProtocol) {
      return message; // No translation needed
    }

    const adapter = this.findAdapter(sourceProtocol, targetProtocol);
    if (!adapter) {
      // If no direct adapter found, try to find a path between protocols
      return this.translateMessageWithIntermediaries(message, sourceProtocol, targetProtocol);
    }

    try {
      const result = await adapter.adaptMessage(message, sourceProtocol, targetProtocol);
      this.emit('messagetranslated', {
        sourceProtocol,
        targetProtocol,
        adapter: adapter.name
      });
      return result;
    } catch (error) {
      this.logger.error(`Error translating message: ${error.message}`);
      throw new Error(`Failed to translate message from ${sourceProtocol} to ${targetProtocol}: ${error.message}`);
    }
  }

  /**
   * Translate a message using intermediary protocols if needed
   */
  private async translateMessageWithIntermediaries(
    message: ProtocolMessage,
    sourceProtocol: ProtocolType,
    targetProtocol: ProtocolType
  ): Promise<ProtocolMessage> {
    // Use A2A_V2 as an intermediary protocol
    const intermediaryProtocol = ProtocolType.A2A_V2;

    // Find adapters to and from the intermediary
    const sourceToIntermediary = this.findAdapter(sourceProtocol, intermediaryProtocol);
    const intermediaryToTarget = this.findAdapter(intermediaryProtocol, targetProtocol);

    if (!sourceToIntermediary || !intermediaryToTarget) {
      throw new Error(`No adapter path found from ${sourceProtocol} to ${targetProtocol}`);
    }

    // Translate in two steps
    const intermediaryMessage = await sourceToIntermediary.adaptMessage(
      message,
      sourceProtocol,
      intermediaryProtocol
    );

    return intermediaryToTarget.adaptMessage(
      intermediaryMessage,
      intermediaryProtocol,
      targetProtocol
    );
  }

  /**
   * Translate a capability from one protocol to another
   */
  async translateCapability(
    capability: ProtocolCapability,
    sourceProtocol: ProtocolType,
    targetProtocol: ProtocolType
  ): Promise<any> {
    if (sourceProtocol === targetProtocol) {
      return capability; // No translation needed
    }

    const adapter = this.findAdapter(sourceProtocol, targetProtocol);
    if (!adapter) {
      throw new Error(`No adapter found for translating capability from ${sourceProtocol} to ${targetProtocol}`);
    }

    try {
      return await adapter.adaptCapability(capability, sourceProtocol, targetProtocol);
    } catch (error) {
      this.logger.error(`Error translating capability: ${error.message}`);
      throw new Error(`Failed to translate capability from ${sourceProtocol} to ${targetProtocol}: ${error.message}`);
    }
  }

  /**
   * Translate a tool from one protocol to another
   */
  async translateTool(
    tool: any,
    sourceProtocol: ProtocolType,
    targetProtocol: ProtocolType
  ): Promise<any> {
    if (sourceProtocol === targetProtocol) {
      return tool; // No translation needed
    }

    const adapter = this.findAdapter(sourceProtocol, targetProtocol);
    if (!adapter) {
      throw new Error(`No adapter found for translating tool from ${sourceProtocol} to ${targetProtocol}`);
    }

    try {
      return await adapter.adaptTool(tool, sourceProtocol, targetProtocol);
    } catch (error) {
      this.logger.error(`Error translating tool: ${error.message}`);
      throw new Error(`Failed to translate tool from ${sourceProtocol} to ${targetProtocol}: ${error.message}`);
    }
  }
}