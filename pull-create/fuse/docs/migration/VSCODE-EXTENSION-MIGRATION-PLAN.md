# VS Code Extension Migration Plan

This document outlines the step-by-step plan for migrating the remaining features from the old VS Code extension to the new version.

## Current Migration Status

The migration has made significant progress with the following components already migrated:

- ✅ Core infrastructure (AgentRegistry, AgentCommunicationService, FileProtocolService)
- ✅ LLM providers (Anthropic, Cerebras, OpenAI, Ollama, VS Code)
- ✅ Base command system with legacy command bridging
- ✅ Basic chat view implementation
- ✅ Roo monitoring integration

## Phase 2: UI Components & Dashboard Migration (Medium Priority)

### Step 1: Communication Hub Provider Migration

1. Create the Communication Hub Provider class:
   - Create `/vscode-extension/src/views/CommunicationHubProvider.ts`
   - Port functionality from old `/old-vscode-extension/src/views/communication-hub-provider.ts`
   - Integrate with existing services (AgentCommunicationService)

2. Register the Communication Hub webview:
   - Update `extension.ts` to register the new webview
   - Add the necessary command for opening the hub
   - Create HTML templates for the webview

### Step 2: Dashboard & Monitoring UI

1. Create the Dashboard Provider:
   - Create `/vscode-extension/src/views/DashboardProvider.ts`
   - Implement monitoring visualization
   - Port functionality from old monitoring components

2. Implement the Settings View Provider:
   - Create `/vscode-extension/src/views/SettingsViewProvider.ts`
   - Enable configuration management within the UI
   - Connect to extension settings

3. Update Package.json:
   - Add view containers for dashboard and monitoring
   - Register new commands for UI navigation

### Step 3: Update Webview Message Handling

1. Create a WebviewMessageRouter:
   - Create `/vscode-extension/src/services/WebviewMessageRouter.ts`
   - Implement message routing between webviews and services
   - Support broadcasting to multiple webviews

## Phase 3: Advanced Collaboration Features (Medium Priority)

### Step 1: Workflow Engine Implementation

1. Create the Workflow Engine:
   - Create `/vscode-extension/src/services/WorkflowEngine.ts`
   - Port functionality from `old-vscode-extension/workflow-engine.tsx`
   - Implement workflow registration, execution and monitoring

2. Next Edit Suggestions Integration:
   - Create `/vscode-extension/src/services/NESWorkflowManager.ts`
   - Port from `old-vscode-extension/workflows/nes-workflow-manager.ts`
   - Connect to VS Code edit suggestion APIs

### Step 2: Advanced Agent Communication

1. Enhance Agent Communication:
   - Update `/vscode-extension/src/services/AgentCommunicationService.ts`
   - Add support for more complex messaging patterns
   - Implement capability negotiation

2. Implement Mode Handlers:
   - Create `/vscode-extension/src/modes/` directory
   - Migrate handlers: architect, ask, code, debug, orchestrator
   - Connect handlers to command system

### Step 3: Master Command Center

1. Create the Command Center:
   - Create `/vscode-extension/src/views/MasterCommandCenterProvider.ts`
   - Implement command routing infrastructure
   - Port from old extension's command center

2. Command Execution Monitoring:
   - Create `/vscode-extension/src/services/CommandMonitor.ts`
   - Track command execution and history
   - Provide command debugging UI

## Phase 4: WebSocket & Chrome Extension Integration (Low Priority)

1. Implement WebSocket Server:
   - Create `/vscode-extension/src/services/WebSocketServer.ts`
   - Enable external communication
   - Add security and authentication

2. Chrome Extension Bridge:
   - Create `/vscode-extension/src/services/ChromeExtensionBridge.ts`
   - Handle communication with Chrome extension
   - Implement message protocol translation

## Phase 5: Extension Configuration (Low-Medium Priority)

1. Enhanced Extension Metadata:
   - Update package.json with proper metadata
   - Add icon and publisher details

2. Complete Configuration Schema:
   - Add all missing configuration options
   - Provide defaults and validation

## Phase 6: Documentation & Testing (Low Priority)

1. User Documentation:
   - Create/update README.md
   - Add usage examples and screenshots
   - Document all commands and features

2. Developer Documentation:
   - Document architecture and component relationships
   - Add API documentation with JSDoc

3. Tests:
   - Create comprehensive test suite
   - Add unit and integration tests
   - Set up CI/CD for tests

## Implementation Timeline

| Phase | Components | Priority | Estimated Time |
|-------|------------|----------|----------------|
| 2     | UI Components & Dashboard | Medium | 2-3 days |
| 3     | Advanced Collaboration | Medium | 3-4 days |
| 4     | WebSocket Integration | Low | 1-2 days |
| 5     | Extension Configuration | Low-Medium | 1 day |
| 6     | Documentation & Testing | Low | 2 days |

## Getting Started

To begin the next phase of migration, follow these steps:

1. Create the Communication Hub Provider
2. Update the package.json with view registrations
3. Implement the basic Dashboard UI
4. Connect components to existing services

This plan will ensure a methodical, step-by-step migration of all remaining functionality from the old extension to the new improved version.
