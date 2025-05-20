# Changelog

All notable changes to The New Fuse project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added secure WebSocket (wss://) support for production use
- Added support for multiple connected clients with unique identifiers
- Added client-specific message routing and management
- Added options page to Chrome extension for configuring WebSocket settings
- Added command to show connected Chrome extension clients in VS Code
- Added exponential backoff for reconnection attempts
- Added connection timeout and monitoring for dead connections
- Added self-signed certificate generation support for development
- Added comprehensive code analysis functionality in code-analyzer.ts
- Added MCP servers from Claude desktop configuration to all project MCP config files
- Added standardized MCP server configuration across all components

### Fixed

- Fixed Chrome extension icon loading issue
- Fixed WebSocket connection issues between Chrome extension and VS Code
- Improved error handling and reconnection logic in Chrome extension
- Added proper cleanup of WebSocket connections when VS Code extension is deactivated
- Fixed authentication flow between Chrome extension and VS Code

### Changed

- Refactored VS Code extension project structure for better organization
- Consolidated utility functions directly into service and component classes
- Reorganized file structure to improve maintainability and clarity
- Integrated functionality from separate utility files (fs-utils, webview-utils, uri-utils, vscode-utils) directly into relevant components

### Bug Fixes

- **Date:** 2025-05-13
- **Title:** Resolved `yarn install` failure due to missing plugin
  **Description:**
  The `yarn install` command was consistently failing with the error: "Internal Error: Cannot find module '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/.yarn/plugins/@yarnpkg/plugin-workspace-tools.cjs'".
  This issue was traced back to a conflict with an explicit plugin configuration within the [`.yarnrc.yml`](./.yarnrc.yml) file.
  The resolution involved removing the `plugins` section from the [`.yarnrc.yml`](./.yarnrc.yml) file. After this change, `yarn install` completes successfully, although some peer dependency warnings remain (these are separate and were present after the fix).

### Improvements

- Updated Chrome extension to support both ws:// and wss:// protocols
- Improved logging in both Chrome extension and VS Code extension
- Enhanced client tracking with unique identifiers
- Updated documentation with secure WebSocket configuration instructions
- Improved error messages and troubleshooting information

## [0.1.0] - 2025-04-15

### Added

- Initial release of The New Fuse
- VS Code extension with AI agent orchestration capabilities
- Chrome extension for browser integration
- WebSocket server for communication between extensions
- Multiple communication protocols for AI agent interaction
- MCP integration for standardized AI agent communication
- Chat interface for interacting with AI agents
- File management tools for AI agents
- Process management tools for AI agents
- Web interaction tools for AI agents
- Code analysis tools for AI agents
