# Gemini Browser Skill

**Automate Chrome's Built-in Gemini AI for Free Compute Delegation**

This TNF skill enables programmatic control of Chrome's built-in Gemini AI,
allowing TNF agents to leverage free AI compute with internet access and
tab-awareness capabilities.

## 🎯 Key Features

- **Browser Automation**: Programmatically control Gemini's chat interface
- **Tab-Aware Context**: Gemini can see and analyze content from multiple
  browser tabs
- **Internet Access**: Leverage Gemini's ability to browse and research
- **Free Compute**: Delegate tasks to Gemini without API costs
- **MCP Integration**: Expose as tools for any TNF agent

## 🚀 Use Cases

1. **Web Research**: Ask Gemini to research topics across multiple websites
2. **Content Analysis**: Have Gemini analyze and compare content from different
   tabs
3. **Summarization**: Summarize articles, documentation, or web pages
4. **Free AI Compute**: Offload non-critical tasks to free Gemini instances
5. **Multi-Tab Synthesis**: Connect information from up to 10 tabs
   simultaneously

## 📦 Installation

```bash
cd packages/gemini-browser-skill
npm install
npm run build
```

## 🔧 Usage

### Direct Usage

```typescript
import { geminiBrowser } from '@the-new-fuse/gemini-browser-skill';

// Initialize
await geminiBrowser.initialize();

// Send a prompt
const response = await geminiBrowser.prompt({
  prompt: 'Summarize the main points from these articles',
  contextUrls: ['https://example.com/article1', 'https://example.com/article2'],
  timeout: 30000,
});

console.log(response.response);

// Close when done
await geminiBrowser.close();
```

### MCP Server Usage

```typescript
import { geminiBrowserMCP } from '@the-new-fuse/gemini-browser-skill';

// Get available tools
const tools = geminiBrowserMCP.getTools();

// Execute a tool
const result = await geminiBrowserMCP.executeTool({
  name: 'gemini_browser_prompt',
  arguments: {
    prompt: 'What are the latest AI developments?',
    contextUrls: ['https://news.ycombinator.com'],
  },
});
```

## 🛠️ Available MCP Tools

### `gemini_browser_prompt`

Send a prompt to Gemini with optional context URLs.

**Arguments:**

- `prompt` (string, required): The prompt to send
- `contextUrls` (string[], optional): URLs to open for context (max 10)
- `timeout` (number, optional): Response timeout in ms (default: 30000)

### `gemini_browser_status`

Check if the browser is initialized and ready.

### `gemini_browser_initialize`

Initialize the Gemini browser automation.

### `gemini_browser_close`

Close the browser and clean up resources.

## 🔍 How It Works

1. **Launch Chrome**: Opens Chrome with Gemini-enabled flags
2. **Navigate to Gemini**: Goes to gemini.google.com
3. **Open Context Tabs**: Opens specified URLs in separate tabs
4. **Trigger Gemini Panel**: Uses keyboard shortcut (Ctrl/Cmd+G)
5. **Type Prompt**: Programmatically types the prompt
6. **Extract Response**: Waits for and extracts Gemini's response
7. **Clean Up**: Closes context tabs

## ⚙️ Configuration

The automation uses Playwright to control Chrome. Make sure you have:

- Chrome browser installed (not Chromium)
- Gemini enabled in your Chrome (available in recent versions)
- Sufficient permissions to launch Chrome with custom flags

## 🔐 Privacy & Security

- Runs in a separate browser instance
- No data is sent to external servers (except Gemini itself)
- Context tabs are closed after each request
- Browser can be closed at any time

## 🎨 Integration with TNF

This skill integrates seamlessly with The New Fuse framework:

1. **Agent Delegation**: Agents can delegate tasks to Gemini
2. **Cost Savings**: Use free Gemini compute for non-critical tasks
3. **Task Routing**: Route research tasks to Gemini automatically
4. **Parallel Processing**: Run multiple Gemini instances in parallel

## 📝 Example Workflows

### Research Assistant

```typescript
// Research a topic across multiple sources
const research = await geminiBrowser.prompt({
  prompt: 'Compare the approaches to AI safety discussed in these articles',
  contextUrls: [
    'https://openai.com/safety',
    'https://anthropic.com/safety',
    'https://deepmind.google/safety',
  ],
});
```

### Content Summarization

```typescript
// Summarize documentation
const summary = await geminiBrowser.prompt({
  prompt: 'Create a concise summary of this documentation',
  contextUrls: ['https://docs.example.com/guide'],
});
```

### Competitive Analysis

```typescript
// Analyze competitor features
const analysis = await geminiBrowser.prompt({
  prompt: 'What features do these products have in common?',
  contextUrls: [
    'https://product1.com/features',
    'https://product2.com/features',
    'https://product3.com/features',
  ],
});
```

## 🚧 Limitations

- Requires visible browser window (not headless)
- Depends on Gemini UI structure (may need updates)
- Limited to Chrome browser
- Requires Gemini to be available in your region
- Response time depends on Gemini's processing speed

## 🔮 Future Enhancements

- [ ] Support for Gemini's voice mode
- [ ] Screenshot capture for visual context
- [ ] Session persistence across requests
- [ ] Queue management for parallel requests
- [ ] Automatic retry on failures
- [ ] Response streaming support

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please see the main TNF repository for guidelines.
