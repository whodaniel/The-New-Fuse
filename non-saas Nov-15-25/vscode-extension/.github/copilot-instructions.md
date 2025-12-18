# GitHub Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a VS Code extension project. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

## Extension Development Guidelines

1. Use TypeScript for all new code
2. Follow VS Code extension development best practices
3. Use proper error handling and logging
4. Implement proper activation events
5. Follow VS Code's extension guidelines for UI and UX

## API Usage

When implementing VS Code extension features:
- Use proper activation events
- Handle disposables correctly
- Follow VS Code's extension API patterns
- Implement proper error handling
- Use VS Code's built-in APIs when available

## VS Code Views and Panels

- Use WebviewView for sidebar views
- Use WebviewPanel for custom editors/panels
- Handle view/panel state restoration properly
- Clean up resources in dispose handlers
