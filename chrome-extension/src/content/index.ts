/**
 * Content script for The New Fuse - AI Bridge
 * This script runs in the context of web pages and provides integration with AI platforms
 */
import { Logger } from '../utils/logger';
import DOMPurify from 'dompurify';

// Create a content-specific logger
const contentLogger = new Logger({
  name: 'Content',
  level: 'info',
  saveToStorage: true
});

// Initialize connection with background script
const port = chrome.runtime.connect({ name: 'content-script' });

// Context menu and selection handling
let lastSelection: string = '';
let activeTextArea: HTMLTextAreaElement | HTMLInputElement | HTMLElement | null = null;
let targetChatInput: HTMLTextAreaElement | HTMLInputElement | HTMLElement | null = null;
let targetChatButton: HTMLButtonElement | null = null;

/**
 * AI platform selectors configuration
 */
interface AIPlatformSelectorsConfig {
  inputSelectors: string | string[];
  buttonSelectors: string | string[];
  codeBlockSelectors: string | string[];
  chatLogSelectors: string | string[];
}

/**
 * Supported AI platforms
 */
const AI_PLATFORMS: Record<string, AIPlatformSelectorsConfig> = {
  'chat.openai.com': {
    inputSelectors: ['textarea[data-testid="prompt-textarea"]', 'textarea#prompt-textarea', 'textarea[placeholder="Send a message"]', 'textarea[placeholder="Message ChatGPT…"]'],
    buttonSelectors: ['button[data-testid="send-button"]', 'button > span.text-white'], // More specific send button
    codeBlockSelectors: ['pre > code', '.markdown pre code'],
    chatLogSelectors: ['div[data-message-author-role]', '.markdown', 'div.group.w-full'] // More specific message containers
  },
  'gemini.google.com': { // Updated from bard.google.com
    inputSelectors: ['div[contenteditable="true"][aria-label*="Prompt"]', 'div.input-area > div[contenteditable="true"]', 'input.textarea', 'textarea[placeholder*="Enter a prompt here"]'],
    buttonSelectors: ['button[aria-label="Send message"]', 'button[aria-label="Submit"]', 'button.send-button'],
    codeBlockSelectors: ['.code-block pre code', '.code-block code', 'pre code'],
    chatLogSelectors: ['.response-container', 'div[data-message-id]', '.message-content']
  },
  'claude.ai': {
    inputSelectors: ['div[contenteditable="true"][aria-label*="Send a message"]', 'div[contenteditable="true"].ProseMirror', 'div[contenteditable="true"]'],
    buttonSelectors: ['button[aria-label="Send message"]', 'button:has(svg[data-icon="arrow-up"])', 'button.text-white.bg-indigo-500'],
    codeBlockSelectors: ['pre code', '.font-mono code'],
    chatLogSelectors: ['.message-content', 'div[data-testid^="conversation-turn-"]']
  },
  'huggingface.co': { // For HuggingChat
    inputSelectors: ['textarea.chat-input', 'textarea[placeholder*="Ask anything"]'],
    buttonSelectors: ['button.send-button', 'form button[type="submit"]'],
    codeBlockSelectors: ['pre code'],
    chatLogSelectors: ['.message-content', 'div.message']
  },
  'perplexity.ai': {
    inputSelectors: ['.input-container textarea', 'textarea[placeholder*="Ask anything..."]'],
    buttonSelectors: ['.input-container button[type="submit"]', 'button[aria-label="Submit"]'],
    codeBlockSelectors: ['pre code', 'div[class*="prose"] pre code'],
    chatLogSelectors: ['.answer', 'div[class*="prose"]']
  },
  'bing.com': { // For Copilot/Bing Chat
    inputSelectors: ['#searchbox', 'cib-text-input textarea', 'textarea[aria-label="Ask Copilot a question"]'],
    buttonSelectors: ['#search_icon', 'cib-search-box-main button[aria-label="Submit"]', 'button.send'],
    codeBlockSelectors: ['pre code', 'cib-code-block code'],
    chatLogSelectors: ['.response', 'cib-message-text', 'div.ac-textBlock']
  }
};

/**
 * Helper function to query for a single element with fallback selectors.
 * @param selectors - A single selector string or an array of selector strings.
 * @returns The first matching HTMLElement or null.
 */
function querySelectorWithFallbacks(selectors: string | string[]): HTMLElement | null {
  if (typeof selectors === 'string') {
    return document.querySelector(selectors) as HTMLElement | null;
  }
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element as HTMLElement;
    }
  }
  return null;
}

/**
 * Helper function to query for multiple elements using the first successful selector from a list.
 * @param selectors - A single selector string or an array of selector strings.
 * @returns A NodeListOf<HTMLElement> from the first successful selector, or an empty NodeList.
 */
function querySelectorAllWithFallbacks(selectors: string | string[]): NodeListOf<HTMLElement> {
  if (typeof selectors === 'string') {
    return document.querySelectorAll(selectors) as NodeListOf<HTMLElement>;
  }
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      return elements as NodeListOf<HTMLElement>;
    }
  }
  // Return an empty NodeList if no selectors match
  return document.querySelectorAll('THIS_SELECTOR_WILL_NEVER_MATCH_ANYTHING_EVER');
}


/**
 * Initialize message handlers
 */
function initializeMessageHandlers(): void {
  // Listen for messages from background script
  port.onMessage.addListener((message: any) => {
    try {
      switch (message.type) {
        case 'insertCode':
          handleCodeInsertion(message.code);
          break;
        case 'insertText':
          handleTextInsertion(message.text);
          break;
        case 'executeAction':
          handleAction(message.action, message.data);
          break;
        case 'highlightCode':
          handleCodeHighlighting(message.code);
          break;
        case 'analyzeCode':
          handleCodeAnalysis(message.code);
          break;
        case 'extractContent':
          extractChatContent();
          break;
        case 'clickButton':
          triggerChatSend();
          break;
        case 'error':
          contentLogger.error('Background script error:', message.error);
          break;
        default:
          contentLogger.warn('Unknown message type from port:', message.type);
      }
    } catch (error) {
      contentLogger.error('Error handling message from port:', error, message);
    }
  });

  // Listen for runtime messages (from popup or other sources)
  chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    try {
      switch (message.type) {
        case 'getSelection':
          sendResponse({ text: lastSelection });
          break;
        case 'getActiveElement':
          sendResponse({ element: getActiveElementInfo() });
          break;
        case 'getPageInfo':
          sendResponse(getPageInfo());
          break;
        case 'getAIChatInfo':
          sendResponse(getAIChatInfo());
          break;
        case 'insertInChat':
          handleTextInsertion(message.text);
          sendResponse({ success: true });
          break;
        case 'extractChatContent':
          const content = extractChatContent();
          sendResponse({ content });
          break;
        case 'sendChat':
          const success = triggerChatSend();
          sendResponse({ success });
          break;
        case 'EXTRACT_CONTENT_FROM_BROWSER_REQUEST':
          // Get current page context
          const pageContext = getCurrentPageContext();
          sendResponse({
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            type: 'EXTRACT_CONTENT_FROM_BROWSER_RESPONSE',
            source: 'chrome-extension-content',
            timestamp: Date.now(),
            correlationId: message.id,
            payload: pageContext
          });
          break;
        case 'INSERT_CONTENT_IN_BROWSER':
          if (message.payload) {
            const { content, targetElementQuery, mode } = message.payload;
            const success = insertContentInBrowser(content, targetElementQuery, mode);
            sendResponse({ success });
          } else {
            contentLogger.error('INSERT_CONTENT_IN_BROWSER: Missing payload');
            sendResponse({ success: false, error: 'Missing payload' });
          }
          break;
        case 'CONTROL_IFRAME_VISIBILITY':
          // This message is expected to come from the iframe's content (FloatingPanel.tsx)
          // or from the background script.
          const iframe = document.getElementById('fuse-floating-panel-iframe') as HTMLIFrameElement | null;
          if (iframe) {
            contentLogger.info(`CONTROL_IFRAME_VISIBILITY: Setting display to ${message.visible ? 'block' : 'none'}`);
            iframe.style.display = message.visible ? 'block' : 'none';
            sendResponse({ status: 'Iframe visibility controlled', visible: message.visible });
          } else {
            contentLogger.error('CONTROL_IFRAME_VISIBILITY: Iframe not found.');
            sendResponse({ status: 'Error: Iframe not found', visible: false });
          }
          break;
        default:
          contentLogger.warn('Unknown runtime message type:', message.type);
          sendResponse({ error: `Unknown message type: ${message.type}` });
          // It's important to call sendResponse for unhandled types if the sender expects a response.
          // However, returning true is only necessary if sendResponse is called asynchronously.
          // If all paths call sendResponse synchronously, `return true` can be conditional or removed.
          // For simplicity and safety, keeping it true if any path might be async.
          return true;
      }
    } catch (error) {
      contentLogger.error('Error handling runtime message:', error, message);
      sendResponse({ success: false, error: (error as Error).message || 'Unknown error handling runtime message' });
    }
    return true; // Keep the message channel open for async responses
  });
}

/**
 * Handle inserting code into active element
 * @param code - Code to insert
 */
function handleCodeInsertion(code: string): void {
  try {
    if (!activeTextArea && !targetChatInput) {
      findAndSetTargetChat();
    }

    const targetElement = activeTextArea || targetChatInput;
    if (!targetElement) {
      contentLogger.warn('No target element found for code insertion.');
      return;
    }

    // Format code properly for insertion
    let formattedCode = code;

    // If the target is a ChatGPT-like platform, we might want to wrap in markdown code blocks
    if (targetElement === targetChatInput && !code.includes('```')) {
      // Try to detect the language
      const langMatch = code.match(/^(?:import|from|def|class|function|const|let|var|if|for|while)/m);
      const lang = langMatch ? detectLanguageFromCode(code) : '';
      formattedCode = `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    // Insert the code
    insertTextIntoElement(targetElement, formattedCode);
  } catch (error) {
    contentLogger.error('Error in handleCodeInsertion:', error, { code });
  }
}

/**
 * Handle inserting plain text into active element
 * @param text - Text to insert
 */
function handleTextInsertion(text: string): void {
  try {
    if (!activeTextArea && !targetChatInput) {
      findAndSetTargetChat();
    }

    const targetElement = activeTextArea || targetChatInput;
    if (!targetElement) {
      contentLogger.warn('No target element found for text insertion.');
      return;
    }

    insertTextIntoElement(targetElement, text);
  } catch (error) {
    contentLogger.error('Error in handleTextInsertion:', error, { text });
  }
}

/**
 * Helper function to detect code language
 * @param code - Code to detect language for
 * @returns Detected language or empty string
 */
function detectLanguageFromCode(code: string): string {
  // Convert to lowercase for case-insensitive keyword checks where appropriate
  const lowerCode = code.toLowerCase();

  // PHP
  if (code.match(/<\?php/)) return 'php';
  // Python
  if (code.match(/^(?:import|from|def|class)\s+[\w_]+/m) || code.match(/@[\w\.]+\s*\n\s*def/m)) return 'python';
  // Ruby
  if (code.match(/^\s*require\s+['"][\w\/]+['"]/m) || code.match(/^\s*def\s+\w+(?:\(.*\))?/m)) return 'ruby';
  // Shell/Bash
  if (code.match(/^#!\/(?:usr\/bin\/env\s+)?(?:bash|sh|zsh)/m) || code.match(/^\s*(?:echo|ls|cd|grep|awk|sed|export)\s+/m)) return 'shell';
  // SQL
  if (lowerCode.match(/\b(select\s+.*\s+from|create\s+table|insert\s+into|update\s+.*\s+set|delete\s+from)\b/s)) return 'sql';
  // XML/HTML (HTML is a form of XML)
  if (code.match(/<([a-zA-Z0-9:]+)\b[^>]*>.*?<\/\1\s*>/s)) return 'xml'; // More robust XML/HTML check
  // JSON (strict check for starting with { or [ and having quoted keys)
  if (code.match(/^\s*(?:\{[\s\S]*\}|\[[\s\S]*\])\s*$/) && code.match(/"[^"]+"\s*:/)) return 'json';
  // C#
  if (code.match(/\b(?:namespace|public\s+class|using\s+System)\b/m)) return 'csharp'; // 'csharp' is common for C#
  // Java
  if (code.match(/\b(?:package\s+[\w\.]+;|import\s+java\.\w+\.*;|public\s+class\s+\w+)\b/m)) return 'java';
  // C++
  if (code.match(/#include\s*<[\w\.]+>/m) || code.match(/\bstd::\w+/m) || code.match(/int\s+main\s*\(/m)) return 'cpp';
  // Go
  if (code.match(/^package\s+\w+/m) || code.match(/^import\s+\(/m) || code.match(/\bfunc\s+\w+\s*\(/m)) return 'go';
  // TypeScript (check for TS-specific syntax first)
  if (code.match(/\b(?:interface|type|enum|declare|public readonly|private readonly|protected readonly)\s+\w+/m) || code.match(/:\s*\w+(?:\[\])?\s*[=;]/m)) return 'typescript';
  // JavaScript (more generic, after TypeScript)
  if (code.match(/\b(?:function|const|let|var|import|export|class|if|for|while|switch|case|return|new|async|await|yield|document\.getElementById|console\.log)\b/m) || code.match(/=>/m)) return 'javascript';
  // CSS
  if (code.match(/([#.]?[\w-]+)\s*\{[\s\S]*?\}/m) || code.match(/[\w-]+\s*:\s*[^;]+;/m)) return 'css';
  
  return ''; // Default if no specific language detected
}

/**
 * Insert text into an element based on its type
 * @param element - Element to insert text into
 * @param text - Text to insert
 */
function insertTextIntoElement(element: HTMLElement, text: string): void {
  if (!element) return;

  if (element.isContentEditable) {
    // For contenteditable elements
    element.focus();
    document.execCommand('insertText', false, text);
  }
  else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    // For standard input elements
    const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
    const start = inputElement.selectionStart || 0;
    const end = inputElement.selectionEnd || 0;
    const currentValue = inputElement.value;

    inputElement.value = currentValue.substring(0, start) + text + currentValue.substring(end);
    inputElement.selectionStart = inputElement.selectionEnd = start + text.length;
    inputElement.focus();

    // Trigger input event to ensure UI updates
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * Execute an action on the page
 * @param action - Action to execute
 * @param data - Action data
 */
function handleAction(action: string, data: any): void {
  try {
    switch (action) {
      case 'click':
        if (data.selector) {
          const element = document.querySelector(data.selector) as HTMLElement;
          if (element) {
            element.click();
          } else {
            contentLogger.warn(`Element not found for click action: ${data.selector}`);
          }
        }
        break;
      case 'sendChat':
        triggerChatSend();
        break;
      case 'scroll':
        if (data.selector) {
          const element = document.querySelector(data.selector) as HTMLElement;
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            contentLogger.warn(`Element not found for scroll action: ${data.selector}`);
          }
        }
        break;
      case 'focus':
        if (data.selector) {
          const element = document.querySelector(data.selector) as HTMLElement;
          if (element) {
            element.focus();
          } else {
            contentLogger.warn(`Element not found for focus action: ${data.selector}`);
          }
        }
        break;
      default:
        contentLogger.warn('Unknown action in handleAction:', action);
    }
  } catch (error) {
    contentLogger.error('Error in handleAction:', error, { action, data });
  }
}

/**
 * Trigger the chat send button
 * @returns Whether the button was clicked
 */
function triggerChatSend(): boolean {
  try {
    if (!targetChatButton) {
      findAndSetTargetChat();
    }

    if (targetChatButton) {
      targetChatButton.click();
      return true;
    }
    contentLogger.warn('targetChatButton not found in triggerChatSend.');
    return false;
  } catch (error) {
    contentLogger.error('Error in triggerChatSend:', error);
    return false;
  }
}

/**
 * Find and set the chat input and send button for this website
 */
function findAndSetTargetChat(): void {
  try {
    const hostname = window.location.hostname;

    // Check if we're on a known AI platform
    for (const platform in AI_PLATFORMS) {
      if (hostname.includes(platform)) {
        const config = AI_PLATFORMS[platform];
        targetChatInput = querySelectorWithFallbacks(config.inputSelectors);
        targetChatButton = querySelectorWithFallbacks(config.buttonSelectors) as HTMLButtonElement | null;
        if (targetChatInput && targetChatButton) { // Found both for a known platform
          contentLogger.info(`Target chat elements found for known platform: ${platform}`);
          return;
        }
      }
    }
    contentLogger.info(`Not on a known AI platform or specific selectors failed. Trying generic selectors for ${hostname}.`);

    // Use heuristics to find a likely chat input if we're not on a known platform or specific selectors failed
    const genericInputSelectors = [
      'textarea[data-testid*="chat-input" i]',
      'textarea[aria-label*="message" i]',
      'textarea[aria-label*="prompt" i]',
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="chat" i]',
      'textarea[placeholder*="ask" i]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][aria-label*="message" i]',
      'div[contenteditable="true"][aria-label*="prompt" i]',
      'input[type="text"][aria-label*="message" i]',
      'input[type="text"][placeholder*="message" i]'
    ];

    targetChatInput = querySelectorWithFallbacks(genericInputSelectors);

    // Common patterns for send buttons
    const genericButtonSelectors = [
      'button[data-testid*="send" i]',
      'button[aria-label*="send" i][type="submit"]',
      'button[aria-label*="send" i]',
      'button[aria-label*="submit" i]',
      'button[title*="send" i]',
      'button[role="button"][aria-label*="send" i]',
      'button.send-button',
      'button.chat-send',
      'button[type="submit"]:has(svg[data-icon*="send" i])',
      'button[type="submit"]:has(svg[data-icon*="paper-plane" i])',
      'button:has(svg[data-icon*="send" i])',
      'button:has(svg[data-icon*="paper-plane" i])',
      'button[class*="send" i][type="submit"]',
      'button[class*="submit" i][type="submit"]'
    ];

    targetChatButton = querySelectorWithFallbacks(genericButtonSelectors) as HTMLButtonElement | null;

    if (targetChatInput) {
      contentLogger.info('Generic chat input found:', targetChatInput);
    } else {
      contentLogger.warn('Could not find a generic chat input field.');
    }
    if (targetChatButton) {
      contentLogger.info('Generic send button found:', targetChatButton);
    } else {
      contentLogger.warn('Could not find a generic send button.');
    }
  } catch (error) {
    contentLogger.error('Error in findAndSetTargetChat:', error);
  }
}

/**
 * Extract chat content from the current page
 * @returns Extracted chat content
 */
function extractChatContent(): string {
  try {
    const hostname = window.location.hostname;

    // Check if we're on a known AI platform
    for (const platform in AI_PLATFORMS) {
      if (hostname.includes(platform)) {
        const config = AI_PLATFORMS[platform];
        const chatElements = querySelectorAllWithFallbacks(config.chatLogSelectors);

        if (chatElements.length > 0) {
          let chatContent = '';
          chatElements.forEach(element => {
            // Extract text content, trying to be a bit smarter
            const textContent = Array.from(element.childNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !(node as HTMLElement).closest('pre')))
              .map(node => node.textContent)
              .join('')
              .trim();
            
            if (textContent) {
              chatContent += textContent + '\n\n';
            }

            // Extract code blocks with their language
            const codeBlocks = querySelectorAllWithFallbacks(config.codeBlockSelectors);
            codeBlocks.forEach(codeBlockContainer => { // Iterate over containers if selector is for container
              const actualCodeElement = codeBlockContainer.tagName === 'CODE' ? codeBlockContainer : codeBlockContainer.querySelector('code');
              if (actualCodeElement) {
                const language = actualCodeElement.className.match(/language-(\w+)/)?.[1] || detectLanguageFromCode(actualCodeElement.textContent || '') || '';
                chatContent += `\`\`\`${language}\n${actualCodeElement.textContent?.trim()}\n\`\`\`\n\n`;
              } else if (codeBlockContainer.tagName === 'PRE' && !actualCodeElement) { // Handle PRE directly if no CODE inside
                  const language = detectLanguageFromCode(codeBlockContainer.textContent || '') || '';
                  chatContent += `\`\`\`${language}\n${codeBlockContainer.textContent?.trim()}\n\`\`\`\n\n`;
              }
            });
          });

          port.postMessage({
            type: 'chatContentExtracted',
            content: chatContent.trim()
          });
          return chatContent.trim();
        }
      }
    }

    // If we're not on a known platform, or specific selectors failed, try a generic approach
    contentLogger.info(`No specific chat log found for ${hostname}. Trying generic chat log selectors.`);
    const genericChatLogSelectors = [
      'div[class*="message"]',
      'div[class*="chat-message"]',
      'div[class*="conversation-turn"]',
      'article[class*="message"]',
      'div[role="log"] article', // Common for ARIA compliant chat logs
      '.message-bubble',
      '.chat-bubble'
    ];
    const genericCodeBlockSelectors = ['pre code', 'pre', 'div[class*="code-block"] code', 'div[class*="code-block"]'];

    const possibleChatElements = querySelectorAllWithFallbacks(genericChatLogSelectors);
    let genericChatContent = '';

    if (possibleChatElements.length > 0) {
      possibleChatElements.forEach(element => {
        const textContent = Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !(node as HTMLElement).closest('pre')))
          .map(node => node.textContent)
          .join('')
          .trim();
        
        if (textContent) {
          genericChatContent += textContent + '\n\n';
        }
        
        const codeBlocks = element.querySelectorAll(genericCodeBlockSelectors.join(', ')); // Combine generic code selectors
        codeBlocks.forEach(codeBlock => {
          const actualCodeElement = codeBlock.tagName === 'CODE' ? codeBlock : codeBlock.querySelector('code');
          const codeText = actualCodeElement?.textContent?.trim() || codeBlock.textContent?.trim();
          if (codeText) {
              const language = actualCodeElement?.className.match(/language-(\w+)/)?.[1] || detectLanguageFromCode(codeText) || '';
              genericChatContent += `\`\`\`${language}\n${codeText}\n\`\`\`\n\n`;
          }
        });
      });
    } else {
      contentLogger.warn('Could not find generic chat messages.');
      // Fallback to simpler body text extraction if no chat structure found
      genericChatContent = document.body.innerText.substring(0, 5000); // Limit length
    }
    
    port.postMessage({
      type: 'chatContentExtracted',
      content: genericChatContent.trim()
    });

    return genericChatContent.trim();
  } catch (error) {
    contentLogger.error('Error in extractChatContent:', error);
    // Attempt to post an error message back if possible, or return an empty string
    try {
      port.postMessage({
        type: 'chatContentExtracted',
        content: '',
        error: (error as Error).message || 'Failed to extract chat content'
      });
    } catch (postError) {
      contentLogger.error('Failed to post error message for extractChatContent:', postError);
    }
    return ''; // Return empty string on error
  }
}

/**
 * Handle code highlighting
 * @param code - Code to highlight
 */
function handleCodeHighlighting(code: string): void {
  if (!lastSelection) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const highlight = document.createElement('span');
  highlight.className = 'fuse-highlight';
  highlight.style.backgroundColor = 'rgba(62, 184, 255, 0.2)';
  highlight.textContent = code;

  range.deleteContents();
  range.insertNode(highlight);
}

/**
 * Handle code analysis
 * @param code - Code to analyze
 */
function handleCodeAnalysis(code: string): void {
  // Send code to background script for analysis
  port.postMessage({
    type: 'analyzeCode',
    code: code || lastSelection,
    context: getPageInfo()
  });
}

/**
 * Active element information
 */
interface ActiveElementInfo {
  tagName: string;
  id: string;
  className: string;
  type?: string;
  value?: string;
  isContentEditable: boolean;
}

/**
 * Get information about the active element
 * @returns Active element information
 */
function getActiveElementInfo(): ActiveElementInfo | null {
  const element = document.activeElement;
  if (!element) return null;

  return {
    tagName: element.tagName,
    id: element.id,
    className: element.className,
    type: (element as HTMLInputElement).type,
    value: (element as HTMLInputElement).value,
    isContentEditable: (element?.hasAttribute('contenteditable') === true) ||
                       ((element as HTMLElement)?.isContentEditable === true) ||
                       element?.tagName === 'TEXTAREA' ||
                       element?.tagName === 'INPUT'
  };
}

/**
 * AI chat information
 */
interface AIChatInfo {
  platform: string;
  hasInputField: boolean;
  hasSubmitButton: boolean;
  url: string;
}

/**
 * Get information about AI chat interface on the current page
 * @returns AI chat information
 */
function getAIChatInfo(): AIChatInfo {
  if (!targetChatInput && !targetChatButton) {
    findAndSetTargetChat();
  }

  const hostname = window.location.hostname;
  let knownPlatform: string | null = null;

  // Check if we're on a known AI platform
  for (const platform in AI_PLATFORMS) {
    if (hostname.includes(platform)) {
      knownPlatform = platform;
      break;
    }
  }

  return {
    platform: knownPlatform || 'unknown',
    hasInputField: !!targetChatInput,
    hasSubmitButton: !!targetChatButton,
    url: window.location.href
  };
}

/**
 * Page information
 */
interface PageInfo {
  url: string;
  title: string;
  language: string;
  lastModified: string;
  referrer: string;
  domain: string;
}

/**
 * Get current page information
 * @returns Page information
 */
function getPageInfo(): PageInfo {
  return {
    url: window.location.href,
    title: document.title,
    language: document.documentElement.lang,
    lastModified: document.lastModified,
    referrer: document.referrer,
    domain: window.location.hostname
  };
}

/**
 * Track text selections
 */
function handleSelection(): void {
  const selection = window.getSelection();
  if (!selection) return;

  lastSelection = selection.toString().trim();

  if (lastSelection) {
    port.postMessage({
      type: 'selectionChanged',
      selection: lastSelection
    });
  }
}

/**
 * Track active text areas and inputs
 * @param event - Focus event
 */
function handleFocus(event: FocusEvent): void {
  const element = event.target as HTMLElement;
  if (element.tagName === 'TEXTAREA' ||
      (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text') ||
      element.isContentEditable) {
    activeTextArea = element;
    port.postMessage({
      type: 'activeElementChanged',
      element: getActiveElementInfo()
    });
  }
}

/**
 * Initialize context menu items
 */
function initializeContextMenus(): void {
  document.addEventListener('contextmenu', (event: MouseEvent) => {
    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (selectedText) {
      port.postMessage({
        type: 'contextMenu',
        selection: selectedText,
        x: event.clientX,
        y: event.clientY
      });
    }
  });
}

/**
 * Initialize observers
 */
function initializeObservers(): void {
  // Create an observer for code blocks
  const codeObserver = new MutationObserver((mutations: MutationRecord[]) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const codeBlocks = element.querySelectorAll('pre, code');
          codeBlocks.forEach(block => {
            block.addEventListener('click', () => {
              port.postMessage({
                type: 'codeBlockClicked',
                code: block.textContent
              });
            });

            // Add copy button to code blocks
            addCopyButtonToCodeBlock(block);
          });
        }
      });
    });
  });

  // Observe the entire document
  codeObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

/**
 * Add copy buttons to code blocks
 * @param block - Code block element
 */
function addCopyButtonToCodeBlock(block: Element): void {
  // Check if this is a known code block format
  if (block.tagName === 'PRE' || block.parentElement?.tagName === 'PRE') {
    // Don't add the button if one already exists
    if (block.querySelector('.fuse-copy-button')) return;

    const target = block.tagName === 'PRE' ? block : block.parentElement;
    if (!target) return;

    // Create a button for copying
    const button = document.createElement('button');
    button.className = 'fuse-copy-button';
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
    button.style.cssText = `
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.25rem;
      background: rgba(255, 255, 255, 0.8);
      border: none;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 1000;
    `;

    // Add hover effect
    const targetElement = target as HTMLElement;
    // Ensure position is relative for absolute positioning of the button
    if (getComputedStyle(targetElement).position === 'static') {
      targetElement.style.position = 'relative';
    }
    
    targetElement.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
    });
    targetElement.addEventListener('mouseleave', () => {
        button.style.opacity = '0';
    });

    // Add click handler
    button.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const code = block.tagName === 'PRE' ? block.textContent : block.textContent;

      // Copy to clipboard
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          // Show success state
          button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>';
          button.style.backgroundColor = 'rgba(74, 222, 128, 0.8)';
          button.style.color = 'white';

          // Revert after a short delay
          setTimeout(() => {
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            button.style.color = 'inherit';
          }, 1500);

          // Send to background script
          port.postMessage({
            type: 'codeCopied',
            code: code,
            source: window.location.href
          });
        }).catch(err => {
          contentLogger.error('Failed to copy code:', err);
          button.style.backgroundColor = 'rgba(248, 113, 113, 0.8)';
          button.style.color = 'white';
        });
      }
    });

    // Add button to DOM
    targetElement.appendChild(button);
  }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners(): void {
  document.addEventListener('selectionchange', handleSelection);
  document.addEventListener('focusin', handleFocus);
  document.addEventListener('focusout', () => {
    activeTextArea = null;
  });

  // Handle keyboard shortcuts
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    // Ctrl/Cmd + Shift + F for quick search
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
      event.preventDefault();
      port.postMessage({ type: 'quickSearch', selection: lastSelection });
    }

    // Ctrl/Cmd + Shift + V for sending to VS Code
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'V') {
      event.preventDefault();
      if (lastSelection) {
        port.postMessage({ type: 'sendToVSCode', content: lastSelection });
      }
    }
  });
}

/**
 * Get current page context including URL, title, and selected text
 * @returns Page context object
 */
function getCurrentPageContext(): { url: string; title: string; selectedText?: string } {
  return {
    url: window.location.href,
    title: document.title,
    selectedText: lastSelection || undefined
  };
}

/**
 * Insert content into the browser page
 * @param content - Content to insert
 * @param targetElementQuery - CSS selector for target element
 * @param mode - Insertion mode: 'replace', 'append', or 'prepend'
 * @returns Whether insertion was successful
 */
function insertContentInBrowser(
  content: string,
  targetElementQuery?: string,
  mode: 'replace' | 'append' | 'prepend' = 'replace'
): boolean {
  try {
    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeHtml(content);

    // Find target element
    let targetElement: HTMLElement | null = null;

    if (targetElementQuery) {
      // Try to find element by selector
      targetElement = document.querySelector(targetElementQuery);
    } else if (activeTextArea) {
      // Use active text area if available
      targetElement = activeTextArea;
    } else if (targetChatInput) {
      // Use chat input if available
      targetElement = targetChatInput;
    } else if (document.activeElement instanceof HTMLElement) {
      // Use active element if it's an input or contenteditable
      const active = document.activeElement;
      if (active.tagName === 'TEXTAREA' ||
          active.tagName === 'INPUT' ||
          active.isContentEditable) {
        targetElement = active;
      }
    }

    // If no target found, try to find a common input element
    if (!targetElement) {
      targetElement = document.querySelector('textarea, input[type="text"], [contenteditable="true"]');
    }

    // If still no target, use body
    if (!targetElement) {
      targetElement = document.body;
    }

    // Insert content based on element type and mode
    if (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') {
      const inputElement = targetElement as HTMLInputElement | HTMLTextAreaElement;

      switch (mode) {
        case 'replace':
          inputElement.value = sanitizedContent;
          break;
        case 'append':
          inputElement.value += sanitizedContent;
          break;
        case 'prepend':
          inputElement.value = sanitizedContent + inputElement.value;
          break;
      }

      // Trigger input event to ensure UI updates
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (targetElement.isContentEditable) {
      // For contenteditable elements
      switch (mode) {
        case 'replace':
          targetElement.innerHTML = sanitizedContent;
          break;
        case 'append':
          targetElement.innerHTML += sanitizedContent;
          break;
        case 'prepend':
          targetElement.innerHTML = sanitizedContent + targetElement.innerHTML;
          break;
      }
    } else {
      // For other elements
      switch (mode) {
        case 'replace':
          targetElement.innerHTML = sanitizedContent;
          break;
        case 'append':
          targetElement.innerHTML += sanitizedContent;
          break;
        case 'prepend':
          targetElement.innerHTML = sanitizedContent + targetElement.innerHTML;
          break;
      }
    }

    return true;
  } catch (error) {
    contentLogger.error('Error inserting content:', error);
    return false;
  }
}

/**
 * Sanitize HTML to prevent XSS
 * @param html - HTML to sanitize
 * @returns Sanitized HTML
 */
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

/**
 * Initialize the content script
 */
function initialize(): void {
  try {
    // Add custom styles
    const style = document.createElement('style');
    style.textContent = `
      .fuse-highlight {
        background-color: rgba(62, 184, 255, 0.2);
        border-radius: 2px;
        padding: 2px;
        margin: 0 2px;
      }

      .fuse-toolbar {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        display: flex;
        padding: 8px;
      }

      .fuse-toolbar button {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        margin: 0 4px;
        color: #333;
        border-radius: 4px;
        padding: 4px 8px;
      }

      .fuse-toolbar button:hover {
        background-color: #f0f0f0;
      }

      @media (prefers-color-scheme: dark) {
        .fuse-toolbar {
          background: #2d2d2d;
        }

        .fuse-toolbar button {
          color: #e8eaed;
        }

        .fuse-toolbar button:hover {
          background-color: #3c3c3c;
        }

        .fuse-copy-button {
          background: rgba(45, 45, 45, 0.8) !important;
          color: #e8eaed !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Check if we're on a known AI platform
    findAndSetTargetChat();

    initializeMessageHandlers();
    initializeContextMenus();
    initializeObservers();
    initializeEventListeners();
    initializeFloatingPanel();

    // Notify background script that content script is ready
    port.postMessage({
      type: 'contentScriptReady',
      chatInfo: getAIChatInfo()
    });

    contentLogger.info('Content script initialized');
  } catch (error) {
    contentLogger.error('Error during content script initialization:', error);
    // Optionally, notify the user or background script about the initialization failure
    try {
      port.postMessage({
        type: 'contentScriptError',
        error: `Initialization failed: ${(error as Error).message}`
      });
    } catch (postError) {
      contentLogger.error('Failed to post initialization error to background:', postError);
    }
    // Display a user-friendly message on the page itself if initialization is critical
    const errorDiv = document.createElement('div');
    errorDiv.textContent = 'The New Fuse extension failed to initialize. Please try reloading the page or contact support.';
    errorDiv.style.cssText = `
      position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
      background-color: #ffdddd; border: 1px solid #ff0000; color: #d8000c;
      padding: 15px; z-index: 2147483647; border-radius: 5px;
      font-family: sans-serif; font-size: 16px; text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    // Only append if body exists
    if (document.body) {
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 10000); // Remove after 10 seconds
    } else {
        // If body is not ready, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 10000);
        });
    }
  }
}

/**
 * Initialize the floating panel
 */
function initializeFloatingPanel(): void {
  try {
    const iframeId = 'fuse-floating-panel-iframe';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;

    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.src = chrome.runtime.getURL('floatingPanel.html');
      
      // Styling the iframe
      iframe.style.border = 'none';
      iframe.style.width = '380px'; // Default width, can be adjusted by user/state
      iframe.style.height = '600px'; // Default height
      iframe.style.position = 'fixed';
      iframe.style.bottom = '20px';
      iframe.style.right = '20px';
      iframe.style.zIndex = '2147483647'; // Max z-index to be on top of everything
      iframe.style.boxShadow = '0px 5px 15px rgba(0,0,0,0.2)';
      iframe.style.borderRadius = '8px';
      iframe.style.display = 'none'; // Initially hidden, visibility controlled by messages

      // Allow transparency if needed for specific designs, though solid is typical
      // iframe.allowTransparency = true;

      document.body.appendChild(iframe);
      contentLogger.info('Floating panel iframe initialized and appended to body.');
    } else {
      contentLogger.info('Floating panel iframe already exists.');
    }

    // The FloatingPanel.tsx (loaded within floatingPanel.html) will listen for
    // 'TOGGLE_FLOATING_PANEL' messages from chrome.runtime.onMessage directly.
    // The content script can also relay messages to the iframe if needed:
    // Example: iframe.contentWindow.postMessage({ type: 'SOME_MESSAGE_FOR_IFRAME', data: {} }, '*');

  } catch (error) {
    contentLogger.error('Error initializing floating panel:', error);
    // Optionally, display an error to the user on the page if this is critical
    const errorDiv = document.createElement('div');
    errorDiv.textContent = 'The New Fuse floating panel failed to load. Please try reloading or contact support.';
    errorDiv.style.cssText = `
      position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%);
      background-color: #ffdddd; border: 1px solid #ff0000; color: #d8000c;
      padding: 10px; z-index: 2147483647; border-radius: 5px;
      font-family: sans-serif; font-size: 14px; text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    if (document.body) {
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 8000);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 8000);
        });
    }
  }
}


// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
