// VSCode Command Architecture Index
// Exports all command-related components for easy importing

// Core adapter
export { VSCodeCommandAdapter, VSCodeCommand, type IVSCodeCommandContext, type IVSCodeCommandResult } from './VSCodeCommandAdapter';

// Registry
export { VSCodeCommandRegistry, VSCodeCommandRegistryFactory } from './VSCodeCommandRegistry';

// API Integration
export { VSCodeAPIIntegration, VSCodeProgressHelper } from './VSCodeAPIIntegration';

// Command Handlers
export * from './handlers/ChatCommandHandlers';
export * from './handlers/MCPCommandHandlers';
export * from './handlers/UICommandHandlers';