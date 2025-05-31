# TNF Agent Communication Relay

This package contains the TNF Agent Communication Relay, a macOS application that enables AI agents to communicate across different environments in The New Fuse ecosystem.

## Contents

1. `TNF-Agent-Relay.applescript` - The main AppleScript code for the relay application
2. `TNF-Agent-Relay-Creator.applescript` - A script to create the application bundle

## Installation Options

### Option 1: Using the Creator Script (Recommended)

1. Open Script Editor on macOS (found in /Applications/Utilities)
2. Open the `TNF-Agent-Relay-Creator.applescript` file
3. Click the Run button (the play icon) in the toolbar
4. Follow the prompts to create the application
5. Choose a location to save the application (e.g., Desktop or Applications folder)

### Option 2: Manual Installation

1. Open Script Editor on macOS (found in /Applications/Utilities)
2. Open the `TNF-Agent-Relay.applescript` file
3. Go to File > Export...
4. Set File Format to "Application"
5. Name it "TNF Agent Relay.app"
6. Choose a save location (e.g., Desktop or Applications folder)
7. Click Save

## Usage Instructions

1. **Launch the Application**:
   - Double-click "TNF Agent Relay.app" to start the application

2. **Start the Relay**:
   - Click "Start/Stop" to start the relay service
   - The status will change from "Stopped" to "Running"

3. **Discover Agents**:
   - Click "Discover" to find available agents
   - The application will populate the agent registry with sample agents

4. **Send Messages**:
   - Click "Send Message"
   - Select an agent from the dropdown list
   - Choose a message type (code_review, refactoring, etc.)
   - Edit the message content if needed
   - Click "Send" to deliver the message

5. **View Message Logs**:
   - Click "Logs" to see a history of sent messages
   - The log shows the most recent messages with details about target, environment, and content

6. **About the Application**:
   - Click "About" to view information about the relay

7. **Exit the Application**:
   - Click "Quit" to close the application

## Integration with The New Fuse Components

For the relay to fully integrate with The New Fuse ecosystem:

1. **VS Code Extension**:
   - The VS Code extension should monitor `/tmp/thefuse/vscode/` for new message files
   - Implement a file watcher in the extension to detect new messages

2. **Chrome Extension**:
   - The Chrome extension should monitor `/tmp/thefuse/chrome/` for new message files
   - This could be done through a native messaging host or a shared file system approach

3. **Terminal Agents**:
   - Terminal-based agents should poll `/tmp/thefuse/terminal/` for new messages
   - Messages can be processed using shell commands or file watchers

## Requirements

- macOS 10.14 or newer
- AppleScript support (built into macOS)

## Directory Structure

The application will automatically create these directories when launched:
- `/tmp/thefuse/vscode/`
- `/tmp/thefuse/chrome/`
- `/tmp/thefuse/terminal/`

## Features

The TNF Agent Communication Relay provides:

1. **Cross-Environment Communication**:
   - Routes messages between VS Code, Chrome, and Terminal environments
   - Uses file-based messaging via the `/tmp/thefuse/` directories
   - Formats messages according to The New Fuse A2A protocol

2. **Agent Discovery**:
   - Maintains a registry of available agents
   - Tracks agent capabilities and environments

3. **Message Templating**:
   - Provides templates for common message types
   - Allows customization of message content

4. **Message Logging**:
   - Keeps a history of sent messages
   - Provides details about message delivery

5. **Simple User Interface**:
   - Easy-to-use dialog-based interface
   - Status monitoring and controls

## Enhancement Roadmap

Planned enhancements for future versions:

1. **Redis Integration**: Replace file-based messaging with Redis Streams
2. **Dynamic Agent Discovery**: Automatically detect agents across environments
3. **MCP Server Integration**: Integrate with the Model Context Protocol server
4. **Enhanced UI**: More robust interface with real-time updates
5. **Security Enhancements**: Message encryption and agent authentication
6. **Distributed Relay Network**: Support for multiple relay instances

## License

This project is part of The New Fuse and is subject to the same licensing terms.
