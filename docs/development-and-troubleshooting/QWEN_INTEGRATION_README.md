# Qwen Integration Guide

This guide provides comprehensive instructions for integrating Qwen AI models
into your development workflow.

## Overview

Qwen (通义千问) is a series of large language models developed by Alibaba Cloud.
This integration allows you to leverage Qwen's capabilities within your
applications and development environment.

## Prerequisites

- Node.js 18+ or Python 3.8+
- API key from Alibaba Cloud (DashScope)
- Basic understanding of LLM integration patterns

## Installation

### Node.js Integration

```bash
pnpm install @alicloud/daashscope
```

### Python Integration

```bash
pip install dashscope
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
DASHSCOPE_API_KEY=your_api_key_here
QWEN_MODEL=qwen-max
QWEN_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
```

### Basic Setup

```javascript
import { DashScope } from '@alicloud/dashscope';

const client = new DashScope({
  apiKey: process.env.DASHSCOPE_API_KEY,
});

async function generateText(prompt) {
  const response = await client.textGeneration({
    model: 'qwen-max',
    input: {
      prompt: prompt,
    },
    parameters: {
      max_tokens: 1000,
      temperature: 0.7,
    },
  });

  return response.output.text;
}
```

## Usage Examples

### Chat Completion

```javascript
async function chatWithQwen(messages) {
  const response = await client.textGeneration({
    model: 'qwen-plus',
    input: {
      messages: messages,
    },
  });

  return response.output.choices[0].message.content;
}
```

### Stream Response

```javascript
async function streamResponse(prompt) {
  const stream = await client.textGeneration({
    model: 'qwen-max',
    input: { prompt },
    parameters: {
      stream: true,
      incremental_output: true,
    },
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.output.text);
  }
}
```

## Model Options

| Model      | Description          | Context Length | Best For                           |
| ---------- | -------------------- | -------------- | ---------------------------------- |
| qwen-max   | Most capable model   | 32k tokens     | Complex reasoning, code generation |
| qwen-plus  | Balanced performance | 32k tokens     | General purpose tasks              |
| qwen-turbo | Fast responses       | 8k tokens      | Quick queries, simple tasks        |

## Integration with VS Code Extension

### Extension Configuration

Add to your VS Code settings.json:

```json
{
  "qwen.apiKey": "${env:DASHSCOPE_API_KEY}",
  "qwen.defaultModel": "qwen-max",
  "qwen.temperature": 0.7,
  "qwen.maxTokens": 2000
}
```

### Command Registration

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'qwen.generateCode',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      const prompt = `Generate code based on: ${selectedText}`;
      const generatedCode = await generateText(prompt);

      await editor.edit((editBuilder) => {
        editBuilder.replace(selection, generatedCode);
      });
    }
  );

  context.subscriptions.push(disposable);
}
```

## Chrome Extension Integration

### Background Script

```javascript
// background.js
import { QwenClient } from './qwen-client.js';

const qwenClient = new QwenClient({
  apiKey: process.env.DASHSCOPE_API_KEY,
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateText') {
    qwenClient
      .generate(request.prompt)
      .then((response) => sendResponse({ success: true, text: response }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keeps message channel open for async response
  }
});
```

### Content Script

```javascript
// content.js
function enhanceTextArea(textarea) {
  const button = document.createElement('button');
  button.textContent = '✨ Enhance with Qwen';
  button.onclick = async () => {
    const text = textarea.value;
    const response = await chrome.runtime.sendMessage({
      action: 'generateText',
      prompt: `Improve this text: ${text}`,
    });

    if (response.success) {
      textarea.value = response.text;
    }
  };

  textarea.parentNode.insertBefore(button, textarea.nextSibling);
}

// Auto-enhance all textareas
document.querySelectorAll('textarea').forEach(enhanceTextArea);
```

## API Reference

### Text Generation

```javascript
await client.textGeneration({
  model: 'qwen-max',
  input: {
    prompt: string,
    // or
    messages: Array<{role: string, content: string}>
  },
  parameters: {
    max_tokens?: number,
    temperature?: number,
    top_p?: number,
    top_k?: number,
    repetition_penalty?: number,
    stop?: string | string[],
    stream?: boolean,
    incremental_output?: boolean
  }
});
```

### Response Format

```javascript
{
  status_code: 200,
  request_id: "request-id",
  code: "",
  message: "",
  output: {
    text: "generated text",
    choices: [
      {
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: "response content"
        }
      }
    ]
  },
  usage: {
    input_tokens: 10,
    output_tokens: 50,
    total_tokens: 60
  }
}
```

## Error Handling

```javascript
try {
  const response = await client.textGeneration(params);
  return response.output.text;
} catch (error) {
  if (error.status_code === 400) {
    console.error('Bad request:', error.message);
  } else if (error.status_code === 401) {
    console.error('Authentication failed:', error.message);
  } else if (error.status_code === 429) {
    console.error('Rate limit exceeded:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
  throw error;
}
```

## Best Practices

1. **Rate Limiting**: Implement proper rate limiting to avoid API quota
   exhaustion
2. **Caching**: Cache responses for identical prompts to reduce API calls
3. **Error Recovery**: Implement retry logic with exponential backoff
4. **Token Management**: Monitor token usage to optimize costs
5. **Security**: Never expose API keys in client-side code

## Troubleshooting

### Common Issues

**Authentication Error**

```
Error: Invalid API key
```

Solution: Verify your DASHSCOPE_API_KEY is correct and active.

**Rate Limit Exceeded**

```
Error: Request rate limit exceeded
```

Solution: Implement request throttling or upgrade your API plan.

**Model Not Found**

```
Error: Model 'qwen-invalid' not found
```

Solution: Use supported model names: qwen-max, qwen-plus, qwen-turbo.

### Debug Mode

Enable detailed logging:

```javascript
const client = new DashScope({
  apiKey: process.env.DASHSCOPE_API_KEY,
  debug: true,
});
```

## Performance Optimization

### Prompt Engineering

- Keep prompts clear and specific
- Use system messages for context
- Limit context length for faster responses

### Streaming for Long Responses

```javascript
async function streamGeneration(prompt) {
  const stream = await client.textGeneration({
    model: 'qwen-max',
    input: { prompt },
    parameters: {
      stream: true,
      max_tokens: 2000,
    },
  });

  let fullResponse = '';
  for await (const chunk of stream) {
    const deltaText = chunk.output.text;
    fullResponse += deltaText;
    // Update UI incrementally
    updateUI(deltaText);
  }

  return fullResponse;
}
```

## Integration Testing

### Unit Tests

```javascript
import { QwenClient } from '../src/qwen-client.js';

describe('Qwen Integration', () => {
  let client;

  beforeEach(() => {
    client = new QwenClient({
      apiKey: process.env.TEST_API_KEY,
    });
  });

  test('should generate text', async () => {
    const response = await client.generate('Hello, world!');
    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
  });

  test('should handle errors gracefully', async () => {
    const clientWithInvalidKey = new QwenClient({
      apiKey: 'invalid-key',
    });

    await expect(clientWithInvalidKey.generate('test')).rejects.toThrow(
      'Authentication failed'
    );
  });
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: [DashScope API Docs](https://help.aliyun.com/zh/dashscope/)
- Issues: Create an issue in this repository
- Community: Join our Discord server for discussions
