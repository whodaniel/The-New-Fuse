/**
 * Browser Automation Tools
 *
 * Wrapped browser tools for AI agents with proper validation and safety.
 */

import { Page } from 'playwright';
import { ToolRegistry, ToolWrapper } from './ToolWrapper';

/**
 * Register all browser tools
 */
export function registerBrowserTools(registry: ToolRegistry, getPage: () => Promise<Page>): void {
  // Browser Navigate
  registry.register(
    new ToolWrapper(
      {
        name: 'browser_navigate',
        description: 'Navigate the headless browser to a URL',
        category: 'browser',
        riskLevel: 'medium',
        timeout: 30000,
        retryable: true,
        parameters: [
          {
            name: 'url',
            type: 'string',
            description: 'The URL to navigate to',
            required: true,
            validation: (value) => {
              if (typeof value !== 'string') return false;
              try {
                new URL(value);
                return true;
              } catch {
                return false;
              }
            },
            sanitize: (value) => {
              // Ensure https for security
              const url = value as string;
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return `https://${url}`;
              }
              return url;
            },
          },
          {
            name: 'waitUntil',
            type: 'string',
            description: 'When to consider navigation succeeded',
            required: false,
            default: 'networkidle',
            enum: ['load', 'domcontentloaded', 'networkidle', 'commit'],
          },
        ],
        returns: {
          type: 'object',
          description: 'Navigation result with URL and page title',
        },
        examples: [
          {
            description: 'Navigate to Google',
            params: { url: 'https://google.com' },
            expectedResult: {
              success: true,
              url: 'https://www.google.com/',
              title: 'Google',
            },
          },
        ],
      },
      async (params) => {
        const page = await getPage();
        await page.goto(params.url as string, {
          waitUntil: params.waitUntil as any,
        });

        const url = page.url();
        const title = await page.title();

        return {
          success: true,
          url,
          title,
        };
      }
    )
  );

  // Browser Screenshot
  registry.register(
    new ToolWrapper(
      {
        name: 'browser_screenshot',
        description: 'Take a screenshot of the current browser page',
        category: 'browser',
        riskLevel: 'low',
        timeout: 10000,
        retryable: true,
        parameters: [
          {
            name: 'fullPage',
            type: 'boolean',
            description: 'Capture full scrollable page',
            required: false,
            default: false,
          },
          {
            name: 'format',
            type: 'string',
            description: 'Screenshot format',
            required: false,
            default: 'png',
            enum: ['png', 'jpeg'],
          },
        ],
        returns: {
          type: 'object',
          description: 'Screenshot as base64 string',
        },
      },
      async (params) => {
        const page = await getPage();
        const screenshot = await page.screenshot({
          fullPage: params.fullPage as boolean,
          type: params.format as 'png' | 'jpeg',
        });

        return {
          success: true,
          screenshot: screenshot.toString('base64'),
          format: params.format,
          url: page.url(),
        };
      }
    )
  );

  // Browser Click
  registry.register(
    new ToolWrapper(
      {
        name: 'browser_click',
        description: 'Click an element on the page using a CSS selector',
        category: 'browser',
        riskLevel: 'medium',
        timeout: 10000,
        retryable: false,
        parameters: [
          {
            name: 'selector',
            type: 'string',
            description: 'CSS selector of the element to click',
            required: true,
          },
          {
            name: 'waitForNavigation',
            type: 'boolean',
            description: 'Wait for navigation after click',
            required: false,
            default: false,
          },
        ],
        returns: {
          type: 'object',
          description: 'Click result',
        },
      },
      async (params) => {
        const page = await getPage();
        const selector = params.selector as string;

        await page.waitForSelector(selector, { timeout: 5000 });

        if (params.waitForNavigation) {
          await Promise.all([page.waitForNavigation(), page.click(selector)]);
        } else {
          await page.click(selector);
        }

        return {
          success: true,
          selector,
          url: page.url(),
        };
      }
    )
  );

  // Browser Type
  registry.register(
    new ToolWrapper(
      {
        name: 'browser_type',
        description: 'Type text into an input field',
        category: 'browser',
        riskLevel: 'medium',
        timeout: 10000,
        retryable: false,
        parameters: [
          {
            name: 'selector',
            type: 'string',
            description: 'CSS selector of the input element',
            required: true,
          },
          {
            name: 'text',
            type: 'string',
            description: 'Text to type',
            required: true,
          },
          {
            name: 'clear',
            type: 'boolean',
            description: 'Clear existing text before typing',
            required: false,
            default: true,
          },
        ],
        returns: {
          type: 'object',
          description: 'Typing result',
        },
      },
      async (params) => {
        const page = await getPage();
        const selector = params.selector as string;
        const text = params.text as string;

        await page.waitForSelector(selector, { timeout: 5000 });

        if (params.clear) {
          await page.fill(selector, '');
        }

        await page.type(selector, text);

        return {
          success: true,
          selector,
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        };
      }
    )
  );

  // Browser Get HTML
  registry.register(
    new ToolWrapper(
      {
        name: 'browser_get_html',
        description: 'Get HTML content of the current page or specific selector',
        category: 'browser',
        riskLevel: 'low',
        timeout: 5000,
        retryable: true,
        parameters: [
          {
            name: 'selector',
            type: 'string',
            description: 'CSS selector to get HTML from (optional, defaults to entire page)',
            required: false,
          },
        ],
        returns: {
          type: 'object',
          description: 'HTML content',
        },
      },
      async (params) => {
        const page = await getPage();

        let html: string;
        if (params.selector) {
          const element = await page.$(params.selector as string);
          if (!element) {
            throw new Error(`Element not found: ${params.selector}`);
          }
          html = await element.innerHTML();
        } else {
          html = await page.content();
        }

        return {
          success: true,
          html,
          length: html.length,
          url: page.url(),
        };
      }
    )
  );

  // Browser Evaluate
  registry.register(
    new ToolWrapper(
      {
        name: 'browser_evaluate',
        description: 'Execute JavaScript in the browser context',
        category: 'browser',
        riskLevel: 'high',
        timeout: 10000,
        retryable: false,
        parameters: [
          {
            name: 'script',
            type: 'string',
            description: 'JavaScript code to execute',
            required: true,
            validation: (value) => {
              if (typeof value !== 'string') return false;
              // Basic safety check - prevent dangerous operations
              const dangerous = ['eval(', 'Function(', '__proto__', 'constructor'];
              return !dangerous.some((d) => (value as string).includes(d));
            },
          },
        ],
        returns: {
          type: 'object',
          description: 'Evaluation result',
        },
      },
      async (params) => {
        const page = await getPage();
        const script = params.script as string;

        const result = await page.evaluate(script);

        return {
          success: true,
          result,
          resultType: typeof result,
        };
      }
    )
  );

  // Browser Wait For Selector
  registry.register(
    new ToolWrapper(
      {
        name: 'browser_wait_for_selector',
        description: 'Wait for an element to appear on the page',
        category: 'browser',
        riskLevel: 'low',
        timeout: 30000,
        retryable: false,
        parameters: [
          {
            name: 'selector',
            type: 'string',
            description: 'CSS selector to wait for',
            required: true,
          },
          {
            name: 'timeout',
            type: 'number',
            description: 'Maximum time to wait in milliseconds',
            required: false,
            default: 30000,
          },
        ],
        returns: {
          type: 'object',
          description: 'Wait result',
        },
      },
      async (params) => {
        const page = await getPage();
        const selector = params.selector as string;
        const timeout = params.timeout as number;

        await page.waitForSelector(selector, { timeout });

        return {
          success: true,
          selector,
          found: true,
        };
      }
    )
  );
}
