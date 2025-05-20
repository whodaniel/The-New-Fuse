import { EventEmitter } from 'events';
import { Message } from '../protocols/ICommunicationProtocol.js';
import { A2AService } from './A2AService.js';
import { MCPService, ToolRequest, ToolResponse } from './MCPService.js';

/**
 * MessageRouter options
 */
export interface MessageRouterOptions {
  a2aService: A2AService;
  mcpService: MCPService;
  debug?: boolean;
}

/**
 * Message Router Service
 * 
 * Coordinates between MCP (agent-tool) and A2A (agent-agent) communication.
 * Provides a unified entry point for all agent communication while properly
 * routing messages to the appropriate service.
 */
export class MessageRouter extends EventEmitter {
  private a2aService: A2AService;
  private mcpService: MCPService;
  private debug: boolean;
  
  constructor(options: MessageRouterOptions) {
    super();
    this.a2aService = options.a2aService;
    this.mcpService = options.mcpService;
    this.debug = options.debug || false;
    
    // Set up event forwarding
    this.setupEventForwarding();
  }
  
  /**
   * Initialize the router
   */
  async initialize(): Promise<void> {
    this.log('Initializing message router');
    
    // No specific initialization required here as the services
    // should be initialized separately
    
    return Promise.resolve();
  }
  
  /**
   * Route an incoming message to the appropriate service
   */
  async routeMessage(message: Message): Promise<void> {
    this.log(`Routing message of type ${message.metadata.type} from ${message.source}`);
    
    // Check the protocol to determine how to route
    const protocol = message.metadata.protocol || '';
    
    if (protocol.startsWith('mcp')) {
      // This is an MCP message, likely a tool request
      this.routeMCPMessage(message);
    } else if (protocol.startsWith('a2a')) {
      // This is an agent-to-agent message
      this.routeA2AMessage(message);
    } else {
      // Unknown protocol, log an error
      console.error(`Unknown protocol in message: ${protocol}`, message);
      this.emit('error', new Error(`Unknown protocol: ${protocol}`));
    }
  }
  
  /**
   * Route an MCP message (tool request)
   */
  private routeMCPMessage(message: Message): void {
    this.log('Routing MCP message', message.metadata);
    
    // Convert to tool request
    if (message.metadata.type === 'TOOL_REQUEST') {
      const toolRequest: ToolRequest = {
        toolName: message.content.toolName,
        parameters: message.content.parameters,
        requestId: message.id,
        callerId: message.source
      };
      
      // Invoke the tool and handle the response
      this.mcpService.invokeTool(toolRequest)
        .then((response: ToolResponse) => {
          // Send the response back to the calling agent
          this.a2aService.sendMessage(
            message.source,
            response,
            'TOOL_RESPONSE',
            message.metadata.conversationId
          ).catch(err => {
            console.error('Failed to send tool response:', err);
          });
        })
        .catch(err => {
          console.error('Error invoking tool:', err);
          
          // Send error response
          this.a2aService.sendMessage(
            message.source,
            {
              toolName: message.content.toolName,
              requestId: message.id,
              success: false,
              error: err.message,
              timestamp: new Date().toISOString()
            },
            'TOOL_RESPONSE',
            message.metadata.conversationId
          ).catch(err => {
            console.error('Failed to send tool error response:', err);
          });
        });
    } else {
      console.warn(`Unhandled MCP message type: ${message.metadata.type}`);
    }
  }
  
  /**
   * Route an A2A message
   */
  private routeA2AMessage(message: Message): void {
    this.log('Routing A2A message', message.metadata);
    
    // A2A messages are already processed by the A2A service directly
    // We're just maintaining this for consistency and future extensions
    
    // Emit an event for this specific message type
    this.emit(`a2a:${message.metadata.type}`, message);
  }
  
  /**
   * Set up event forwarding from services to router
   */
  private setupEventForwarding(): void {
    // Forward A2A service events
    this.a2aService.on('message', (message: Message) => {
      this.emit('a2a:message', message);
    });
    
    // Forward MCP service events
    this.mcpService.on('tool:success', (response: ToolResponse) => {
      this.emit('mcp:tool:success', response);
    });
    
    this.mcpService.on('tool:error', (response: ToolResponse) => {
      this.emit('mcp:tool:error', response);
    });
  }
  
  /**
   * Utility method for logging
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      if (data) {
        console.log(`[Router] ${message}`, data);
      } else {
        console.log(`[Router] ${message}`);
      }
    }
  }
}