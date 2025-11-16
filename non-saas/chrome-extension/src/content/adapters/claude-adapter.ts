/**
 * @file Concrete implementation of the BaseAdapter for Anthropic's Claude.
 */

import { BaseAdapter } from './base-adapter';
import { JsonRpcRequest } from '../../types';

export class ClaudeAdapter extends BaseAdapter {
  // These selectors are examples and would need to be kept up-to-date
  // with Claude's actual DOM structure.
  private readonly SELECTORS = {
    textInput: 'div.ProseMirror',
    submitButton: 'button[aria-label="Send message"]',
    responseContainer: 'div.overflow-y-auto',
    latestResponse: 'div.group.flex',
  };

  protected constructPrompt(request: JsonRpcRequest): string {
    const { method, params } = request;

    const instruction = `
      IMPORTANT: You must provide your entire response exclusively in a JSON format within a markdown code block.
      Do not include any explanatory text outside of the JSON block.

      Request Method: "${method}"
      Request Parameters: ${JSON.stringify(params, null, 2)}

      Based on the above, perform the requested task and structure your output accordingly.
    `;
    return instruction.trim();
  }

  protected async injectAndSubmit(prompt: string): Promise<void> {
    const inputArea = document.querySelector<HTMLDivElement>(this.SELECTORS.textInput);
    const submitButton = document.querySelector<HTMLButtonElement>(this.SELECTORS.submitButton);

    if (!inputArea || !submitButton) {
      throw new Error('Claude UI elements (input or submit button) not found.');
    }

    // Inject the prompt
    inputArea.innerHTML = `<p>${prompt.replace(/\n/g, '<br>')}</p>`;

    // A small delay to ensure the UI processes the input
    await new Promise(resolve => setTimeout(resolve, 100));

    // Click the submit button
    submitButton.click();
  }

  protected watchForResponse(requestId: string | number | null): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = 30000; // 30-second timeout

      const observer = new MutationObserver((mutations, obs) => {
        const responseElements = document.querySelectorAll(this.SELECTORS.latestResponse);
        const latestResponse = responseElements[responseElements.length - 1];

        if (latestResponse && latestResponse.textContent) {
          if (latestResponse.textContent.trim().length > 10) {
            obs.disconnect();
            clearTimeout(timer);
            resolve(latestResponse.textContent);
          }
        }
      });

      const responseContainer = document.querySelector(this.SELECTORS.responseContainer);
      if (!responseContainer) {
        return reject(new Error('Claude response container not found.'));
      }

      observer.observe(responseContainer, {
        childList: true,
        subtree: true,
      });

      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timed out after ${timeout / 1000}s waiting for Claude response.`));
      }, timeout);
    });
  }

  protected watchAndRelayNextResponse(): void {
    this.watchForResponse('cli-response')
      .then(responseText => {
        console.log('[Adapter] Captured response for relay:', responseText);
        chrome.runtime.sendMessage({
          type: 'SEND_BROADCAST_TO_RELAY',
          payload: {
            type: 'cli.chat.receiveMessage',
            payload: {
              text: responseText,
            },
          },
        });
      })
      .catch(error => {
        console.error('[Adapter] Error watching for relay response:', error);
      });
  }
}
