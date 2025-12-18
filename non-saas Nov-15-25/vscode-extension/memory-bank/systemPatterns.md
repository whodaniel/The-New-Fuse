# System Patterns

## System Architecture
- The project is a VSCode extension, implying an event-driven architecture interacting with the VSCode API.
- Key components likely include:
    - Extension activation (`src/extension.ts`).
    - Webview providers for UI elements (e.g., `ChatViewProvider`, `SettingsViewProvider`).
    - Services for specific functionalities (e.g., `LLMProviderManager`, `AgentCommunicationService`).
    - Type definitions (`src/types/`).
    - LLM provider integrations (`src/llm/providers/`).

## Key Technical Decisions
- Use of TypeScript for static typing and improved code quality.
- Modular design with services and providers.
- (Further decisions will be documented as they are understood or made).

## Design Patterns in Use
- **Provider Pattern:** Used for managing Webviews (e.g., `ChatViewProvider`).
- **Service Locator/Manager:** `LLMProviderManager` seems to manage different LLM provider implementations.
- **Event-Driven:** Interactions with VSCode API and webview communication are likely event-based.
- (More patterns may be identified as the codebase is explored).

## Component Relationships
- `extension.ts` likely serves as the entry point, initializing and registering various components.
- Webview providers interact with services to fetch data and handle logic.
- `WebviewMessageRouter` likely handles communication between webviews and the extension backend.
- LLM providers are managed by `LLMProviderManager` and used by services or views requiring LLM capabilities.

## Critical Implementation Paths
- Extension activation and initialization.
- Webview creation and message handling.
- LLM query processing.
- Agent communication and management.
- Settings management.
