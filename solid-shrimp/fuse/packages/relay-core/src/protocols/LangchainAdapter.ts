/**
 * Langchain Protocol Adapter
 * 
 * Handles Langchain's agent framework format
 * Converts between Langchain agent messages and The New Fuse's A2A protocol
 */

import { ProtocolAdapter } from './ProtocolAdapter.js';
import { RelayMessage, ProtocolType } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export class LangchainAdapter implements ProtocolAdapter {
  public readonly name = 'langchain';
  public readonly version = '1.0.0';
  public readonly supportedProtocols: ProtocolType[] = [
    'langchain-v1.0',
    'a2a-v2.0'
  ];

  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  canTranslate(from: ProtocolType, to: ProtocolType): boolean {
    return this.supportedProtocols.includes(from) && this.supportedProtocols.includes(to);
  }

  async translate(message: RelayMessage, sourceProtocol: ProtocolType, targetProtocol: ProtocolType): Promise<RelayMessage> {

    if (sourceProtocol === 'langchain-v1.0' && targetProtocol === 'a2a-v2.0') {
      return this.langchainToA2A(message);
    } else if (sourceProtocol === 'a2a-v2.0' && targetProtocol === 'langchain-v1.0') {
      return this.a2aToLangchain(message);
    }

    throw new Error(`Unsupported translation: ${sourceProtocol} -> ${targetProtocol}`);
  }

  private langchainToA2A(message: RelayMessage): RelayMessage {
    const { payload } = message;

    // Handle Langchain agent actions
    if (this.isLangchainAgentAction(payload)) {
      return {
        ...message,
        type: 'AGENT_ACTION',
        payload: {
          tool: payload.tool,
          toolInput: payload.tool_input,
          log: payload.log,
          reasoning: this.extractLangchainReasoning(payload),
          agentType: payload.agent_type || 'langchain',
          intermediateSteps: payload.intermediate_steps || []
        },
        metadata: {
          ...message.metadata,
          protocol: 'a2a-v2.0',
          originalProtocol: 'langchain-v1.0',
          translatedAt: new Date().toISOString()
        }
      };
    }

    // Handle Langchain agent finish
    if (this.isLangchainAgentFinish(payload)) {
      return {
        ...message,
        type: 'AGENT_FINISH',
        payload: {
          result: payload.return_values?.output || payload.output,
          returnValues: payload.return_values,
          log: payload.log,
          reasoning: this.extractLangchainReasoning(payload)
        },
        metadata: {
          ...message.metadata,
          protocol: 'a2a-v2.0',
          originalProtocol: 'langchain-v1.0',
          translatedAt: new Date().toISOString()
        }
      };
    }

    // Handle Langchain tool execution
    if (this.isLangchainToolExecution(payload)) {
      return {
        ...message,
        type: 'TOOL_EXECUTION',
        payload: {
          tool: payload.tool_name || payload.name,
          input: payload.input,
          output: payload.output,
          success: !payload.error,
          error: payload.error,
          executionTime: payload.execution_time
        },
        metadata: {
          ...message.metadata,
          protocol: 'a2a-v2.0',
          originalProtocol: 'langchain-v1.0',
          translatedAt: new Date().toISOString()
        }
      };
    }

    // Handle Langchain memory/history
    if (this.isLangchainMemory(payload)) {
      return {
        ...message,
        type: 'MEMORY_UPDATE',
        payload: {
          messages: payload.messages || payload.chat_memory?.messages || [],
          memory: payload.memory || payload.buffer,
          memoryType: payload.memory_type || 'conversation',
          context: payload.context
        },
        metadata: {
          ...message.metadata,
          protocol: 'a2a-v2.0',
          originalProtocol: 'langchain-v1.0',
          translatedAt: new Date().toISOString()
        }
      };
    }

    // Handle Langchain chain execution
    if (this.isLangchainChainExecution(payload)) {
      return {
        ...message,
        type: 'CHAIN_EXECUTION',
        payload: {
          chainType: payload.chain_type || payload._type,
          input: payload.input,
          output: payload.output,
          intermediateSteps: payload.intermediate_steps || [],
          chainConfig: payload.chain_config || payload.config
        },
        metadata: {
          ...message.metadata,
          protocol: 'a2a-v2.0',
          originalProtocol: 'langchain-v1.0',
          translatedAt: new Date().toISOString()
        }
      };
    }

    // Generic Langchain message
    return {
      ...message,
      payload: {
        content: this.extractLangchainContent(payload),
        type: payload._type || payload.type || 'unknown',
        metadata: this.extractLangchainMetadata(payload)
      },
      metadata: {
        ...message.metadata,
        protocol: 'a2a-v2.0',
        originalProtocol: 'langchain-v1.0',
        translatedAt: new Date().toISOString()
      }
    };
  }

  private a2aToLangchain(message: RelayMessage): RelayMessage {
    const { payload } = message;

    // Convert A2A agent action to Langchain format
    if (message.type === 'AGENT_ACTION') {
      return {
        ...message,
        payload: this.createLangchainAgentAction(payload),
        metadata: {
          ...message.metadata,
          protocol: 'langchain-v1.0',
          originalProtocol: 'a2a-v2.0',
          translatedAt: new Date().toISOString()
        }
      };
    }

    // Convert A2A agent finish to Langchain format
    if (message.type === 'AGENT_FINISH') {
      return {
        ...message,
        payload: this.createLangchainAgentFinish(payload),
        metadata: {
          ...message.metadata,
          protocol: 'langchain-v1.0',
          originalProtocol: 'a2a-v2.0',
          translatedAt: new Date().toISOString()
        }
      };
    }

    // Convert A2A tool execution to Langchain format
    if (message.type === 'TOOL_EXECUTION') {
      return {
        ...message,
        payload: this.createLangchainToolExecution(payload),
        metadata: {
          ...message.metadata,
          protocol: 'langchain-v1.0',
          originalProtocol: 'a2a-v2.0',
          translatedAt: new Date().toISOString()
        }
      };
    }

    // Convert A2A memory update to Langchain format
    if (message.type === 'MEMORY_UPDATE') {
      return {
        ...message,
        payload: this.createLangchainMemory(payload),
        metadata: {
          ...message.metadata,
          protocol: 'langchain-v1.0',
          originalProtocol: 'a2a-v2.0',
          translatedAt: new Date().toISOString()
        }
      };
    }

    // Convert A2A chain execution to Langchain format
    if (message.type === 'CHAIN_EXECUTION') {
      return {
        ...message,
        payload: this.createLangchainChainExecution(payload),
        metadata: {
          ...message.metadata,
          protocol: 'langchain-v1.0',
          originalProtocol: 'a2a-v2.0',
          translatedAt: new Date().toISOString()
        }
      };
    }

    // Generic A2A to Langchain conversion
    return {
      ...message,
      payload: this.createLangchainMessage(payload),
      metadata: {
        ...message.metadata,
        protocol: 'langchain-v1.0',
        originalProtocol: 'a2a-v2.0',
        translatedAt: new Date().toISOString()
      }
    };
  }

  // Langchain format detection helpers
  private isLangchainAgentAction(payload: any): boolean {
    return !!(payload.tool && payload.tool_input !== undefined);
  }

  private isLangchainAgentFinish(payload: any): boolean {
    return !!(payload.return_values || (payload.output && !payload.tool));
  }

  private isLangchainToolExecution(payload: any): boolean {
    return !!(payload.tool_name || (payload.name && payload.input !== undefined));
  }

  private isLangchainMemory(payload: any): boolean {
    return !!(payload.messages || payload.chat_memory || payload.memory);
  }

  private isLangchainChainExecution(payload: any): boolean {
    return !!(payload.chain_type || payload._type || payload.intermediate_steps);
  }

  // Langchain parsing helpers
  private extractLangchainReasoning(payload: any): string {
    return payload.log || payload.reasoning || payload.thought || '';
  }

  private extractLangchainContent(payload: any): string {
    return payload.content || payload.text || payload.output || payload.message || JSON.stringify(payload);
  }

  private extractLangchainMetadata(payload: any): any {
    return {
      type: payload._type || payload.type,
      agentType: payload.agent_type,
      chainType: payload.chain_type,
      model: payload.model || payload.llm_model,
      temperature: payload.temperature,
      maxTokens: payload.max_tokens,
      tools: payload.tools?.map((tool: any) => tool.name || tool),
      memory: payload.memory_type
    };
  }

  // Langchain format generation helpers
  private createLangchainAgentAction(payload: any): any {
    return {
      tool: payload.tool,
      tool_input: payload.toolInput,
      log: payload.reasoning || payload.log || '',
      agent_type: payload.agentType || 'tnf_agent',
      intermediate_steps: payload.intermediateSteps || []
    };
  }

  private createLangchainAgentFinish(payload: any): any {
    return {
      return_values: {
        output: payload.result
      },
      log: payload.reasoning || payload.log || ''
    };
  }

  private createLangchainToolExecution(payload: any): any {
    return {
      tool_name: payload.tool,
      input: payload.input,
      output: payload.output,
      error: payload.success === false ? payload.error : undefined,
      execution_time: payload.executionTime
    };
  }

  private createLangchainMemory(payload: any): any {
    return {
      messages: payload.messages || [],
      chat_memory: {
        messages: payload.messages || []
      },
      memory: payload.memory,
      memory_type: payload.memoryType || 'conversation',
      context: payload.context
    };
  }

  private createLangchainChainExecution(payload: any): any {
    return {
      chain_type: payload.chainType || 'tnf_chain',
      _type: payload.chainType || 'tnf_chain',
      input: payload.input,
      output: payload.output,
      intermediate_steps: payload.intermediateSteps || [],
      chain_config: payload.chainConfig || {}
    };
  }

  private createLangchainMessage(payload: any): any {
    return {
      content: payload.content || payload.message,
      _type: 'tnf_message',
      metadata: payload.metadata || {}
    };
  }
}