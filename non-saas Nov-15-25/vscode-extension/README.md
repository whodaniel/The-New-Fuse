# The New Fuse

The New Fuse is a VS Code extension for AI agent coordination and communication within your development environment. It provides a framework for LLMs to collaborate and assist you with coding tasks.

## Features

- **AI Chat Interface**: Interactive chat view for communicating with AI agents
- **Multiple LLM Providers**: Support for VS Code built-in models, OpenAI, and Ollama
- **Auto-fallback**: Automatic provider switching on rate limits or errors
- **Model Context Protocol**: Connect to external agent services via WebSocket or HTTP
- **Monitoring**: Track LLM usage, performance, and generations

## Model Context Protocol (MCP)

The Model Context Protocol enables communication between the extension and external AI services. It provides:

- **Robust Connectivity**: WebSocket-based communication with automatic reconnection
- **HTTP Fallback**: Falls back to HTTP transport when WebSocket is unavailable
- **Progress Reporting**: Real-time updates for long-running operations
- **Error Handling**: Comprehensive error detection and recovery

### MCP Commands

- **Connect to MCP Server**: Establish a connection to an MCP server
- **Disconnect from MCP Server**: Close the connection to the MCP server
- **Check MCP Server Health**: Verify that the MCP server is responding correctly
- **Configure MCP Settings**: Open settings to customize MCP behavior
- **MCP Server Menu**: Access all MCP-related commands in one place

## LLM Provider Management

The extension supports multiple LLM providers with automatic fallback:

- **VS Code**: Uses VS Code's built-in language models (default)
- **OpenAI**: Connect to OpenAI's API for GPT models
- **Ollama**: Use locally running Ollama models

## Configuration

### Model Context Protocol Settings

- `theNewFuse.mcp.url`: URL of the MCP server (WebSocket or HTTP)
- `theNewFuse.mcp.autoConnect`: Automatically connect to MCP server on startup
- `theNewFuse.mcp.useEnhancedClient`: Use the enhanced client with reconnection support
- `theNewFuse.mcp.autoReconnect`: Automatically reconnect when connection is lost
- `theNewFuse.mcp.maxReconnectAttempts`: Maximum number of reconnection attempts
- `theNewFuse.mcp.reconnectDelayMs`: Delay between reconnection attempts
- `theNewFuse.mcp.enableStreamableHttp`: Enable HTTP streaming when WebSocket is unavailable
- `theNewFuse.mcp.enableProgressReporting`: Show progress for long-running operations
- `theNewFuse.mcp.timeoutMs`: Timeout for HTTP requests
- `theNewFuse.mcp.commandTimeoutMs`: Timeout for individual MCP commands

### LLM Provider Settings

- `theNewFuse.llmProvider`: Select which LLM provider to use (vscode, openai, ollama)
- `theNewFuse.openai.apiKey`: API key for OpenAI (if using OpenAI provider)
- `theNewFuse.ollama.url`: URL of your Ollama server (if using Ollama provider)
- `theNewFuse.ollama.model`: Default model to use with Ollama

## Requirements

- VS Code 1.100.0 or higher
- Internet connection for OpenAI provider
- Ollama installed locally for Ollama provider
- MCP server for external agent services

## Development Status

This extension is in active development. Check the project documentation for current status and development progress.

## License

[MIT](LICENSE)

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
