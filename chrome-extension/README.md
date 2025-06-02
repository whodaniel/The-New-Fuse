# The New Fuse - Enhanced Chrome Extension with AI Integration

## 🚀 Overview

The New Fuse Chrome Extension v2.0 is a powerful AI-powered browser automation tool that bridges web-based AI chat interfaces with your local AI infrastructure. It features intelligent element selection, automated chat interactions, and seamless integration with The New Fuse ecosystem.

## ✨ Key Features

### 🎯 Smart Element Selection
- **Click-to-Select Mode**: Easily identify chat input fields, send buttons, and output areas
- **AI-Powered Auto-Detection**: Automatically identifies common chat interface elements
- **Persistent Mappings**: Saves element configurations per domain for future use
- **Validation System**: Ensures selected elements remain functional across page updates

### 🧠 AI Integration
- **TNF Relay Bridge**: Connects to your local TNF ecosystem via WebSocket
- **Agent Communication**: Enables AI agents to control browser interfaces
- **Session Management**: Manages AI automation sessions with real-time status
- **Multi-Model Support**: Works with ChatGPT, Claude, Gemini, and custom interfaces

### 🤖 Browser Automation
- **Human-like Interactions**: Simulates realistic typing and clicking patterns
- **Response Monitoring**: Waits for and captures AI responses automatically
- **Cross-Site Compatibility**: Works across different chat interfaces
- **Error Recovery**: Handles interface changes and network issues gracefully

### 🔧 Advanced Configuration
- **Per-Domain Settings**: Customizable configurations for different sites
- **Export/Import**: Share element mappings between installations
- **Debug Tools**: Comprehensive logging and troubleshooting features
- **Accessibility Support**: Full keyboard navigation and screen reader compatibility

## 📦 Installation

### Prerequisites
- Chrome Browser (version 88 or later)
- Node.js (for TNF Relay)
- The New Fuse ecosystem (optional but recommended)

### Quick Install
1. Download the extension files
2. Open Chrome Extensions (`chrome://extensions/`)
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory
5. Pin the extension to your toolbar

### With TNF Integration
1. Install the extension (as above)
2. Start the Enhanced TNF Relay:
   ```bash
   cd "The New Fuse"
   ./start-enhanced-relay.sh
   ```
3. Configure the extension to connect to `ws://localhost:3001`

## 🎮 Usage Guide

### Basic Element Selection

1. **Open Extension Popup**
   - Click the TNF extension icon in your toolbar
   - Navigate to the "Page Element Configuration" section

2. **Auto-Detect Elements**
   - Click "🤖 Auto-Detect Elements"
   - The extension will automatically find chat interface components
   - Review the detected elements in the mapping display

3. **Manual Selection**
   - Click "📝 Select Chat Input" to manually select the text input field
   - Click on the desired element on the page
   - Repeat for "📤 Select Send Button" and "💬 Select Chat Output"

4. **Validate Configuration**
   - Click "✅ Validate Current" to test your element mapping
   - Fix any issues reported by the validation system

### AI Session Management

1. **Start AI Session**
   - Ensure all elements are configured
   - Check that TNF Relay is connected (green status indicator)
   - Click "🚀 Start AI Session"

2. **Test Automation**
   - Use "📨 Test Send Message" to verify message sending works
   - Use "📋 Test Capture Response" to verify response capture works

3. **Advanced Automation**
   - Once a session is active, AI agents can control the interface remotely
   - Use voice commands or programmatic requests via TNF Relay

### Keyboard Shortcuts

- `Ctrl+Shift+E`: Toggle element selection mode
- `Ctrl+Shift+D`: Auto-detect chat elements
- `Ctrl+Shift+A`: Start AI automation session

## 🔧 Configuration

### Extension Settings

Access settings through the extension popup:

- **Relay URL**: WebSocket endpoint for TNF communication (default: `ws://localhost:3001`)
- **Auto-Connect**: Automatically connect to relay on startup
- **Auto-Retry**: Retry failed element selections automatically
- **AI Validation**: Use AI to validate element selections
- **Save Per Domain**: Maintain separate configurations per website

### Advanced Configuration

```javascript
// Example element mapping configuration
{
  "chatInput": {
    "selector": "#prompt-textarea",
    "xpath": "//textarea[@id='prompt-textarea']",
    "confidence": 0.95
  },
  "sendButton": {
    "selector": "button[data-testid='send-button']",
    "xpath": "//button[@data-testid='send-button']",
    "confidence": 0.90
  },
  "chatOutput": {
    "selector": ".conversation-turn",
    "xpath": "//div[contains(@class,'conversation-turn')]",
    "confidence": 0.85
  }
}
```

## 🌐 Supported Platforms

### Tested Chat Interfaces
- ✅ **ChatGPT** (chat.openai.com)
- ✅ **Claude** (claude.ai)
- ✅ **Google Gemini** (gemini.google.com)
- ✅ **Perplexity** (perplexity.ai)
- ✅ **Character.AI** (character.ai)
- ✅ **Poe** (poe.com)
- ⚠️ **Custom Interfaces** (requires manual configuration)

### Browser Compatibility
- ✅ Chrome 88+
- ✅ Edge 88+
- ⚠️ Firefox (manual installation required)
- ❌ Safari (not supported)

## 🔌 TNF Relay Integration

### Enhanced Relay Features

The Enhanced TNF Relay v3.0 provides:

- **WebSocket API**: Real-time communication with browser extensions
- **HTTP REST API**: RESTful endpoints for status and control
- **Agent Discovery**: Automatic detection of connected AI agents
- **Session Management**: Persistent AI automation sessions
- **Message Routing**: Intelligent routing between agents and browser

### API Endpoints

#### HTTP API (Port 3000)
- `GET /status` - Relay status and statistics
- `GET /agents` - List connected agents
- `GET /chrome-extensions` - List connected browser extensions
- `GET /ai-sessions` - List active AI sessions
- `POST /send-message` - Send message to specific agent
- `GET /element-mappings` - Get available element mappings

#### WebSocket API (Port 3001)
- **Connection**: `ws://localhost:3001`
- **Authentication**: Automatic registration on connect
- **Message Types**: 
  - `REGISTER` - Register client capabilities
  - `AI_AUTOMATION_REQUEST` - Request browser automation
  - `ELEMENT_INTERACTION_REQUEST` - Request element interaction
  - `PAGE_ANALYSIS_REQUEST` - Request page analysis
  - `SESSION_CONTROL` - Control AI sessions

### Example Usage

```javascript
// Connect to TNF Relay
const ws = new WebSocket('ws://localhost:3001');

// Register as Chrome extension
ws.send(JSON.stringify({
  type: 'REGISTER',
  payload: {
    type: 'chrome_extension',
    capabilities: ['element_selection', 'ai_automation', 'page_interaction']
  }
}));

// Request AI automation
ws.send(JSON.stringify({
  type: 'AI_AUTOMATION_REQUEST',
  payload: {
    action: 'sendMessage',
    parameters: {
      message: 'Hello, AI!',
      waitForResponse: true
    }
  }
}));
```

## 🛠 Development

### Building from Source

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd "The New Fuse/chrome-extension"
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Extension**
   ```bash
   npm run build
   ```

4. **Development Mode**
   ```bash
   npm run dev
   ```

### Project Structure

```
chrome-extension/
├── src/
│   ├── background.ts          # Service worker
│   ├── content/
│   │   ├── index.ts          # Content script
│   │   └── element-selector.ts # Element selection logic
│   ├── popup/
│   │   ├── index.ts          # Popup interface
│   │   └── element-selection-manager.ts # UI management
│   ├── utils/
│   │   ├── logger.ts         # Logging utilities
│   │   └── websocket-manager.ts # WebSocket communication
│   └── styles/
│       └── element-selection.css # Enhanced styles
├── manifest.json             # Extension manifest
└── package.json             # Dependencies
```

### Adding New Features

1. **Element Detection Patterns**
   ```typescript
   // Add new detection patterns in element-selector.ts
   const newPatterns = {
     customChat: {
       input: '.custom-input-class',
       button: '.custom-send-button',
       output: '.custom-message-container'
     }
   };
   ```

2. **AI Automation Actions**
   ```typescript
   // Add new automation actions in content/index.ts
   case 'customAction':
     await executeCustomAction(parameters);
     break;
   ```

3. **Relay Message Types**
   ```typescript
   // Add new message handlers in background.ts
   case 'CUSTOM_REQUEST':
     await handleCustomRequest(ws, message);
     break;
   ```

## 🧪 Testing

### Manual Testing Checklist

#### Element Selection
- [ ] Auto-detection works on ChatGPT
- [ ] Auto-detection works on Claude
- [ ] Manual selection mode functions correctly
- [ ] Element validation catches broken selectors
- [ ] Mappings persist across browser sessions

#### AI Integration
- [ ] TNF Relay connection establishes successfully
- [ ] AI sessions start and stop correctly
- [ ] Message sending automation works
- [ ] Response capture functions properly
- [ ] Error handling works for network issues

#### Browser Compatibility
- [ ] Extension loads in Chrome
- [ ] Extension loads in Edge
- [ ] All features work in incognito mode
- [ ] Performance is acceptable on slow devices

### Automated Testing

```bash
# Run extension tests
npm test

# Run integration tests with relay
npm run test:integration

# Run performance tests
npm run test:performance
```

## 🐛 Troubleshooting

### Common Issues

#### Extension Not Loading
- Check browser console for errors
- Verify manifest.json syntax
- Ensure all required permissions are granted
- Try reloading the extension in developer mode

#### Element Selection Failing
- Check if page structure has changed
- Verify selectors using browser DevTools
- Try re-running auto-detection
- Check for iframe or shadow DOM elements

#### TNF Relay Connection Issues
- Verify relay is running on correct port
- Check firewall settings
- Ensure WebSocket URL is correct in settings
- Check browser console for connection errors

#### AI Automation Not Working
- Verify all elements are configured
- Check TNF Relay connection status
- Ensure AI session is active
- Check relay logs for error messages

### Debug Mode

Enable debug mode for detailed logging:

1. Open extension popup
2. Go to Settings
3. Enable "Debug Mode"
4. Check browser console for detailed logs

### Log Analysis

```bash
# View extension logs
tail -f "The New Fuse/logs/relay.log"

# Export extension logs
# Use the "Export Logs" button in extension settings
```

## 🔒 Security & Privacy

### Data Handling
- **Local Storage Only**: All configurations stored locally in browser
- **No External Servers**: Direct connection to your local TNF Relay
- **Minimal Permissions**: Only requests necessary browser permissions
- **Open Source**: Full source code available for audit

### Network Security
- **WebSocket Encryption**: Use WSS for production deployments
- **Local Only**: Default configuration only connects to localhost
- **No Telemetry**: No usage data sent to external services
- **User Control**: All automation requires explicit user initiation

### Best Practices
- Run TNF Relay on isolated network when possible
- Use strong authentication for production deployments
- Regularly update extension and dependencies
- Monitor relay logs for suspicious activity

## 📚 API Reference

### Element Selection API

```typescript
interface ElementInfo {
  selector: string;        // CSS selector
  xpath: string;          // XPath expression
  tag: string;            // HTML tag name
  id?: string;            // Element ID
  classes: string[];      // CSS classes
  text: string;           // Element text content
  confidence: number;     // Detection confidence (0-1)
  elementType: 'input' | 'button' | 'output' | 'unknown';
}

interface PageElementMapping {
  chatInput?: ElementInfo;
  sendButton?: ElementInfo;
  chatOutput?: ElementInfo;
  timestamp: number;
  url: string;
  domain: string;
}
```

### Automation API

```typescript
// Send message to chat interface
chrome.tabs.sendMessage(tabId, {
  type: 'SEND_TO_PAGE_INPUT',
  payload: {
    text: 'Hello, AI!',
    waitForResponse: true
  }
});

// Capture response from chat interface
chrome.tabs.sendMessage(tabId, {
  type: 'CAPTURE_PAGE_OUTPUT',
  payload: {}
});

// Execute AI action
chrome.tabs.sendMessage(tabId, {
  type: 'EXECUTE_AI_ACTION',
  payload: {
    action: 'sendMessage',
    parameters: {
      message: 'Hello!',
      waitForResponse: true
    }
  }
});
```

### Relay Communication API

```typescript
// TNF Relay WebSocket message format
interface RelayMessage {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: string;
}

// Register with relay
const registerMessage: RelayMessage = {
  id: 'msg_001',
  type: 'REGISTER',
  source: 'chrome_extension',
  payload: {
    type: 'chrome_extension',
    capabilities: ['element_selection', 'ai_automation']
  },
  timestamp: new Date().toISOString()
};
```

## 🤝 Contributing

### Development Setup

1. **Fork the Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make Changes**
4. **Add Tests**
5. **Submit Pull Request**

### Coding Standards

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add JSDoc comments for public APIs
- Include unit tests for new functionality
- Update documentation for new features

### Contribution Areas

- 🐛 Bug fixes and stability improvements
- 🎯 New element detection patterns
- 🤖 Additional AI automation capabilities
- 🌐 Support for new chat interfaces
- 📚 Documentation improvements
- 🧪 Test coverage expansion

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- The New Fuse ecosystem contributors
- Chrome Extension API documentation
- WebSocket protocol specification
- Open source AI and automation communities

## 📞 Support

### Community Resources
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Complete guides and API reference
- **Examples**: Sample implementations and use cases

### Professional Support
- **Enterprise Deployments**: Custom integration assistance
- **Training**: Team onboarding and best practices
- **Consulting**: Architecture and optimization guidance

---

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Compatibility**: Chrome 88+, Edge 88+  
**License**: MIT
