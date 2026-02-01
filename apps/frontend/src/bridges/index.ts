/**
 * ============================================================
 * BRIDGE LAYER EXPORTS
 * ============================================================
 *
 * This file serves as the single entry point for all Bridge Layer
 * types and hooks. UI components should import from here.
 */

// Export Types
export * from './types/BridgeCommon';

// Export Relay Bridge
export * from './relay/RelayProvider';
export * from './relay/useRelayCore';

// Export Bridge UI Components
export * from './components/BridgeConnectionStatus';

// Export Agent Bridge
export * from './agent/useAgentBridge';

// Export Workflow Bridge
export * from './workflow/useWorkflowBridge';

// Export MCP Bridge
export * from './mcp/useMCPBridge';

// Export Extension Bridge
export * from './extension/useExtensionBridge';

// Export Placeholders for Phase 2+ Bridges
// These allow import scaffolding to be built before implementation
export const useFairtableData = undefined;
export const useVectorDB = undefined;
