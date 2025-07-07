# The New Fuse Chrome Extension - User Guide

## Introduction

The New Fuse Chrome Extension is a powerful tool that bridges your browser and VS Code, enabling seamless integration between web browsing and coding. This guide will help you understand how to use the extension and take advantage of its features.

## Installation

1. Download the extension from the Chrome Web Store or load it as an unpacked extension in developer mode.
2. Make sure you have The New Fuse VS Code extension installed in your VS Code.
3. Click the extension icon in your browser toolbar to open the popup.

## Getting Started

### Connecting to VS Code

1. Open VS Code with The New Fuse extension installed.
2. Click the extension icon in your browser toolbar.
3. If the connection status shows "Disconnected", click the "Connect" button.
4. If the connection is successful, the status will change to "Connected".

### Basic Navigation

The extension popup has several tabs:

- **Home**: Quick access to main features and connection status
- **Chat**: Send messages between browser and VS Code
- **Tools**: Access various tools for code analysis, generation, and more
- **Settings**: Configure the extension

## Features

### Dark Mode

The extension supports both light and dark themes:

1. Click the theme toggle button (sun/moon icon) in the top-right corner of the popup.
2. The theme will switch between light and dark mode.
3. The extension will remember your preference for future sessions.

### File Transfer

Transfer files between your browser and VS Code:

1. Go to the Tools tab.
2. Click "File Browser" to open the file browser in VS Code.
3. To send a file from the browser to VS Code:
   - Drag and drop a file onto the designated area in the popup.
   - Or click "Upload File" and select a file from your computer.
4. To receive a file from VS Code:
   - The file will appear in the "Received Files" section.
   - Click "Save" to download it to your computer.

### Code Snippets

Save and reuse code snippets:

1. Go to the Tools tab.
2. Click "Code Snippets" to open the code snippets manager.
3. To add a new snippet:
   - Click "Add Snippet".
   - Enter a name, description, and the code.
   - Select a language and add tags if desired.
   - Click "Save".
4. To use a snippet:
   - Browse or search for the snippet you want.
   - Click "Copy" to copy it to your clipboard.
   - Or click "Send to VS Code" to insert it directly into your editor.

### AI Integration

The extension integrates with multiple AI models:

1. Go to the Tools tab.
2. Click "AI Assistant" to open the AI assistant.
3. Select an AI model from the dropdown menu.
4. Type your query or request in the input field.
5. Click "Send" to submit your request.
6. The AI's response will appear in the chat area.

## Accessibility Features

The extension includes several accessibility features:

### High Contrast Mode

1. Go to the Settings tab.
2. In the Accessibility section, check "High Contrast".
3. The UI will switch to a high-contrast theme for better visibility.

### Large Text Mode

1. Go to the Settings tab.
2. In the Accessibility section, check "Large Text".
3. The text size will increase throughout the extension.

### Reduced Motion

1. Go to the Settings tab.
2. In the Accessibility section, check "Reduced Motion".
3. Animations will be minimized or disabled.

### Keyboard Navigation

1. Go to the Settings tab.
2. In the Accessibility section, check "Keyboard Navigation".
3. Use the following keyboard shortcuts:
   - Alt+1 to Alt+9: Switch between tabs
   - Alt+S: Open settings
   - Alt+T: Toggle theme
   - Alt+C: Connect/disconnect
   - Tab: Navigate through interactive elements
   - Enter/Space: Activate buttons and controls

### Screen Reader Optimization

1. Go to the Settings tab.
2. In the Accessibility section, check "Screen Reader".
3. The UI will be optimized for screen readers with improved ARIA attributes and labels.

## Advanced Settings

### WebSocket Connection

Configure the WebSocket connection to VS Code:

1. Go to the Settings tab.
2. In the Connection section, set the protocol, host, and port.
3. Default values are:
   - Protocol: ws
   - Host: localhost
   - Port: 3712
4. Click "Save Settings" to apply changes.

### Compression

Enable or disable WebSocket compression:

1. Go to the Settings tab.
2. Check or uncheck "Use Compression".
3. Compression reduces data transfer size but may slightly increase CPU usage.

### Debug Mode

Enable debug mode for troubleshooting:

1. Go to the Settings tab.
2. Check "Debug Mode".
3. Additional logging and debug tools will be available.
4. Click "Export Logs" to save logs for analysis.

## Troubleshooting

### Connection Issues

If you're having trouble connecting to VS Code:

1. Make sure VS Code is running with The New Fuse extension installed.
2. Check that the WebSocket port (default: 3712) is not blocked by a firewall.
3. Try clicking "Test WebSocket" in the Settings tab to test the connection.
4. If using a custom port, make sure it matches in both the Chrome and VS Code extensions.

### Authentication Issues

If you're having authentication problems:

1. Click "Clear Authentication" in the Settings tab.
2. Reconnect to VS Code.
3. Follow the authentication prompts.

### Performance Issues

If the extension is running slowly:

1. Enable compression in the Settings tab.
2. Disable debug mode if it's enabled.
3. Clear logs and chat history periodically.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Alt+1 | Switch to Home tab |
| Alt+2 | Switch to Chat tab |
| Alt+3 | Switch to Tools tab |
| Alt+4 | Switch to Settings tab |
| Alt+S | Open settings |
| Alt+T | Toggle theme |
| Alt+C | Connect/disconnect |
| Ctrl+Shift+F | Quick search (when text is selected) |
| Ctrl+Shift+V | Send selected text to VS Code |

## Getting Help

If you need additional help:

1. Click "Open Documentation" in the About section of the Settings tab.
2. Visit the GitHub repository for the latest updates and issues.
3. Submit bug reports or feature requests through GitHub issues.

---

Thank you for using The New Fuse Chrome Extension! We hope it enhances your development workflow and makes coding more efficient.
