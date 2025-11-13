"use strict";
/**
 * Agent Protocol Bridge Package
 *
 * Universal protocol bridge for The New Fuse AI Agent framework.
 * Enables seamless communication between different agent protocols and
 * comprehensive integration with various systems.
 *
 * ✨ NEW: Enhanced with TRAYCER-style Agent Communication
 *
 * Core Protocols:
 * - A2A (Agent-to-Agent) v1.0 & v2.0
 * - MCP (Model Context Protocol)
 * - Claude Sub-Agent Protocol
 * - Pydantic Agent Protocol
 * - And more...
 *
 * TRAYCER-style Agent Hub Features:
 * - Agent Discovery & Health Monitoring
 * - Multi-Agent Task Orchestration
 * - Protocol Translation & Communication Bridge
 * - Workflow Management & Context Preservation
 * - Error Recovery & Resource Management
 * - Hot-Reload Configuration Support
 *
 * Integration Systems:
 * - N8N Workflow Automation
 * - Webhook Event Delivery
 * - Server-Sent Events (SSE)
 * - WebSocket Real-Time Communication
 * - Blockchain/Web3 Integration
 * - Theia IDE Integration
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.INTEGRATION_CAPABILITIES = exports.BRIDGE_TYPES = exports.SUPPORTED_PROTOCOLS = exports.ProtocolValidator = exports.AgentCommunicationBridge = exports.TaskOrchestrator = exports.AgentDiscoveryService = exports.AgentHub = exports.IntegrationBridgeFactoryImplementation = exports.AgentProtocolBridge = void 0;
exports.createAgentHub = createAgentHub;
exports.createIntegratedAgentStack = createIntegratedAgentStack;
exports.createAgentDiscoveryService = createAgentDiscoveryService;
exports.createTaskOrchestrator = createTaskOrchestrator;
exports.createAgentCommunicationBridge = createAgentCommunicationBridge;
exports.validateAgentHubConfiguration = validateAgentHubConfiguration;
// Main bridge service
var AgentProtocolBridge_1 = require("./AgentProtocolBridge");
Object.defineProperty(exports, "AgentProtocolBridge", { enumerable: true, get: function () { return AgentProtocolBridge_1.AgentProtocolBridge; } });
var IntegrationBridgeFactory_1 = require("./IntegrationBridgeFactory");
Object.defineProperty(exports, "IntegrationBridgeFactoryImplementation", { enumerable: true, get: function () { return IntegrationBridgeFactory_1.IntegrationBridgeFactoryImplementation; } });
// Enhanced Agent Services (TRAYCER-style)
var AgentHub_1 = require("./services/AgentHub");
Object.defineProperty(exports, "AgentHub", { enumerable: true, get: function () { return AgentHub_1.AgentHub; } });
var AgentDiscoveryService_1 = require("./services/AgentDiscoveryService");
Object.defineProperty(exports, "AgentDiscoveryService", { enumerable: true, get: function () { return AgentDiscoveryService_1.AgentDiscoveryService; } });
var TaskOrchestrator_1 = require("./services/TaskOrchestrator");
Object.defineProperty(exports, "TaskOrchestrator", { enumerable: true, get: function () { return TaskOrchestrator_1.TaskOrchestrator; } });
var AgentCommunicationBridge_1 = require("./services/AgentCommunicationBridge");
Object.defineProperty(exports, "AgentCommunicationBridge", { enumerable: true, get: function () { return AgentCommunicationBridge_1.AgentCommunicationBridge; } });
// Protocol adapters
__exportStar(require("./adapters"), exports);
// Validation
var ProtocolValidator_1 = require("./validation/ProtocolValidator");
Object.defineProperty(exports, "ProtocolValidator", { enumerable: true, get: function () { return ProtocolValidator_1.ProtocolValidator; } });
// Core types
__exportStar(require("./types/claude-types"), exports);
// Integration systems
__exportStar(require("./integrations"), exports);
// Constants and utilities
exports.SUPPORTED_PROTOCOLS = [
    'A2A_V1',
    'A2A_V2',
    'MCP',
    'CLAUDE_SUB_AGENT',
    'PYDANTIC',
    'GOOGLE_A2A',
    'ANTHROPIC_MCP',
    'ANTHROPIC_XML',
    'OPENAI_ASSISTANT',
    'LANGCHAIN',
    'AUTOGEN',
    'CREWAI',
    'PYDANTIC_AGENT',
    // Integration protocol extensions
    'N8N_WORKFLOW',
    'WEBHOOK_SYSTEM',
    'SSE_EVENTS',
    'WEB3_BLOCKCHAIN',
    'STREAMING_HTTP',
    'LANGFLOW',
    'LANGCHAIN'
];
exports.BRIDGE_TYPES = [
    'MCP',
    'A2A',
    'WEBSOCKET',
    'REDIS',
    'HTTP',
    'GRPC',
    'THEIA',
    'ELECTRON',
    'RELAY',
    // Integration bridge types
    'N8N',
    'WEBHOOK',
    'SSE',
    'WEB3',
    'BLOCKCHAIN',
    'CLAUDE',
    'PYDANTIC',
    'STREAMING_HTTP',
    'LANGFLOW',
    'LANGCHAIN'
];
exports.INTEGRATION_CAPABILITIES = [
    // Workflow automation
    'n8n_workflow_execution',
    'n8n_webhook_handling',
    'n8n_scheduling',
    // Event delivery
    'webhook_outbound_delivery',
    'webhook_signature_verification',
    'webhook_retry_handling',
    // Real-time communication
    'sse_event_streaming',
    'sse_subscription_management',
    'websocket_bidirectional_communication',
    'websocket_room_management',
    // Blockchain integration
    'web3_account_management',
    'web3_transaction_handling',
    'web3_smart_contract_interaction',
    'web3_event_monitoring',
    // IDE integration
    'theia_workspace_management',
    'theia_file_operations',
    'theia_language_server_protocol',
    'theia_debug_protocol',
    // Claude Sub-Agent capabilities
    'claude_sub_agent_orchestration',
    'claude_task_delegation',
    'claude_terminal_integration',
    'claude_tool_use',
    // Enhanced Agent Hub capabilities (TRAYCER-style)
    'agent_discovery',
    'agent_health_monitoring',
    'multi_agent_orchestration',
    'task_workflow_management',
    'agent_communication_bridge',
    'protocol_translation',
    'context_preservation',
    'error_recovery',
    'resource_management',
    'hot_reload_configuration',
    // Pydantic capabilities
    'pydantic_model_serialization',
    'pydantic_model_deserialization',
    'pydantic_data_validation',
    'pydantic_schema_generation',
    // Streaming HTTP capabilities
    'streaming_http_connection_management',
    'streaming_http_event_delivery',
    'streaming_http_reconnection_handling',
    // LangFlow capabilities
    'langflow_flow_management',
    'langflow_flow_execution',
    'langflow_component_interaction',
    // Langchain capabilities
    'langchain_chain_execution',
    'langchain_agent_running',
    'langchain_tool_usage',
    'langchain_memory_management'
];
exports.VERSION = '2.0.0';
// Convenience factory functions for TRAYCER-style agent communication
const factory = new IntegrationBridgeFactoryImplementation();
/**
 * Create a simple AgentHub instance for basic agent communication
 */
async function createAgentHub(config) {
    return factory.createAgentHub(config);
}
/**
 * Create an integrated agent stack with all TRAYCER-style services
 */
async function createIntegratedAgentStack(config) {
    return factory.createIntegratedAgentStack(config);
}
/**
 * Create an agent discovery service for configuration management
 */
async function createAgentDiscoveryService(options) {
    return factory.createAgentDiscoveryService(options);
}
/**
 * Create a task orchestrator for workflow management
 */
async function createTaskOrchestrator(options) {
    return factory.createTaskOrchestrator(options);
}
/**
 * Create an agent communication bridge for protocol translation
 */
async function createAgentCommunicationBridge(a2aService, mcpClient, messageRouter, config) {
    return factory.createAgentCommunicationBridge(a2aService, mcpClient, messageRouter, config);
}
/**
 * Validate agent hub configuration
 */
function validateAgentHubConfiguration(config) {
    return factory.validateConfiguration(config);
}
//# sourceMappingURL=index.original.js.map