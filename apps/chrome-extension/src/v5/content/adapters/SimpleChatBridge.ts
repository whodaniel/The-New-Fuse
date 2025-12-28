/**
 * Fuse Connect v6 - Simple Chat Bridge
 *
 * Dead simple implementation:
 * 1. Find the input field
 * 2. Type into it
 * 3. Click send
 * 4. Watch for new AI response
 * 5. Return it
 *
 * No complex streaming detection, no site configs, no fallback strategies.
 * Just works.
 */

export interface ChatElements {
  input: HTMLElement | null;
  sendButton: HTMLElement | null;
  isReady: boolean;
}

export interface ChatBridgeCallbacks {
  onResponse?: (content: string) => void;
  onError?: (error: string) => void;
}

class SimpleChatBridge {
  private lastResponseText = '';
  private responseObserver: MutationObserver | null = null;
  private callbacks: ChatBridgeCallbacks = {};
  private isWaitingForResponse = false;
  private responseCheckInterval: number | null = null;

  /**
   * Initialize the bridge with callbacks
   */
  init(callbacks: ChatBridgeCallbacks): void {
    this.callbacks = callbacks;
    console.log('[SimpleChatBridge] Initialized');
  }

  /**
   * Find chat elements on the page
   */
  findElements(): ChatElements {
    // Gemini input - it's a contenteditable div with specific classes
    const input = document.querySelector<HTMLElement>(
      'div.ql-editor.textarea, ' +
        'div[contenteditable="true"][role="textbox"], ' +
        'div[contenteditable="true"][data-placeholder]'
    );

    // Gemini send button - look for the send/submit button
    const sendButton = document.querySelector<HTMLElement>(
      'button[aria-label*="Send" i], ' +
        'button[aria-label*="send" i], ' +
        'button[data-testid*="send" i], ' +
        'button.send-button'
    );

    const isReady = !!(input && sendButton);

    console.log('[SimpleChatBridge] Elements found:', {
      hasInput: !!input,
      hasSendButton: !!sendButton,
      isReady,
    });

    return { input, sendButton, isReady };
  }

  /**
   * Send a message to the AI
   */
  async sendMessage(text: string): Promise<boolean> {
    const { input, sendButton, isReady } = this.findElements();

    if (!isReady || !input || !sendButton) {
      console.error('[SimpleChatBridge] Chat elements not ready');
      this.callbacks.onError?.('Chat elements not found');
      return false;
    }

    try {
      // Step 1: Focus the input
      input.focus();
      await this.delay(100);

      // Step 2: Clear existing content and set new text
      if (input.getAttribute('contenteditable') === 'true') {
        // For contenteditable divs (Gemini uses Quill)
        input.innerHTML = '';
        input.textContent = text;

        // Dispatch input event to trigger Quill's update
        input.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: text,
          })
        );
      } else {
        // For textareas
        (input as HTMLTextAreaElement).value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      await this.delay(200);

      // Step 3: Capture current response count before sending
      const responsesBefore = this.countModelResponses();
      console.log('[SimpleChatBridge] Responses before send:', responsesBefore);

      // Step 4: Click send
      sendButton.click();
      console.log('[SimpleChatBridge] Message sent:', text.substring(0, 50));

      // Step 5: Start watching for new response
      this.startWatchingForResponse(responsesBefore);

      return true;
    } catch (error) {
      console.error('[SimpleChatBridge] Error sending message:', error);
      this.callbacks.onError?.(`Send failed: ${error}`);
      return false;
    }
  }

  /**
   * Count current model responses on the page
   */
  private countModelResponses(): number {
    // Gemini now uses custom element <model-response>
    const responses = document.querySelectorAll('model-response');
    return responses.length;
  }

  /**
   * Get the latest model response text
   */
  private getLatestResponse(): string | null {
    // Gemini now uses custom element <model-response> with .markdown inside
    const responses = document.querySelectorAll('model-response');

    if (responses.length === 0) {
      return null;
    }

    // Get the last one
    const lastResponse = responses[responses.length - 1] as HTMLElement;

    // Find the markdown content inside
    const markdownEl = lastResponse.querySelector('.markdown');
    if (!markdownEl) {
      // Fallback to full text if no .markdown found
      return (lastResponse.textContent || '').trim() || null;
    }

    // Clone and clean it
    const clone = markdownEl.cloneNode(true) as HTMLElement;

    // Remove buttons, action areas, etc.
    clone
      .querySelectorAll('button, [role="button"], .chip, [class*="action"]')
      .forEach((el) => el.remove());

    // Get clean text
    const text = (clone.textContent || '').trim();

    return text.length > 0 ? text : null;
  }

  /**
   * Check if AI is still generating (streaming)
   */
  private isStreaming(): boolean {
    // Gemini shows various indicators while streaming
    const streamingIndicators = [
      'span[class*="cursor"][class*="blink"]',
      '[class*="thinking"]',
      '[class*="loading-spinner"]',
      '[class*="generating"]',
    ];

    for (const selector of streamingIndicators) {
      if (document.querySelector(selector)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Start watching for a new response
   */
  private startWatchingForResponse(responseCountBefore: number): void {
    this.isWaitingForResponse = true;
    let stableCount = 0;
    let lastContent = '';

    // Poll for response completion
    this.responseCheckInterval = window.setInterval(() => {
      const currentCount = this.countModelResponses();

      // Check if we have a new response
      if (currentCount > responseCountBefore) {
        const content = this.getLatestResponse();
        const streaming = this.isStreaming();

        console.log('[SimpleChatBridge] Checking response...', {
          newContent: !!content,
          streaming,
          contentLength: content?.length || 0,
        });

        if (content) {
          // Check if content is stable (same for 2 checks) and not streaming
          if (content === lastContent && !streaming) {
            stableCount++;

            if (stableCount >= 2) {
              // Response is complete!
              this.stopWatching();

              // Only emit if different from last response
              if (content !== this.lastResponseText) {
                this.lastResponseText = content;
                console.log('[SimpleChatBridge] Response complete!', content.substring(0, 100));
                this.callbacks.onResponse?.(content);
              }
            }
          } else {
            stableCount = 0;
            lastContent = content;
          }
        }
      }
    }, 1000); // Check every second

    // Timeout after 60 seconds
    setTimeout(() => {
      if (this.isWaitingForResponse) {
        console.warn('[SimpleChatBridge] Response timeout');
        this.stopWatching();
        this.callbacks.onError?.('Response timeout');
      }
    }, 60000);
  }

  /**
   * Stop watching for response
   */
  private stopWatching(): void {
    this.isWaitingForResponse = false;
    if (this.responseCheckInterval) {
      clearInterval(this.responseCheckInterval);
      this.responseCheckInterval = null;
    }
  }

  /**
   * Get the last detected response (for manual queries)
   */
  getLastResponse(): string | null {
    return this.getLatestResponse();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopWatching();
    if (this.responseObserver) {
      this.responseObserver.disconnect();
      this.responseObserver = null;
    }
  }

  /**
   * Simple delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton
export const simpleChatBridge = new SimpleChatBridge();
