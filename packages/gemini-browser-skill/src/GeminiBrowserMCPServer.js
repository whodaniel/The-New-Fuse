/**
 * Gemini Browser MCP Server
 *
 * Exposes Gemini browser automation as MCP tools
 * Allows any TNF agent to delegate tasks to free Gemini compute
 */
import { geminiBrowser } from './GeminiBrowserAutomation';
export class GeminiBrowserMCPServer {
  constructor() {
    this.tools = [
      {
        name: 'gemini_browser_prompt',
        description:
          "Send a prompt to Chrome's built-in Gemini AI. Gemini can see tab contents and access the internet. Use this for web research, content analysis, or any task that benefits from free AI compute.",
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt to send to Gemini',
            },
            contextUrls: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional URLs to open in tabs for Gemini to analyze (up to 10 tabs)',
            },
            timeout: {
              type: 'number',
              description: 'Response timeout in milliseconds (default: 30000)',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'gemini_browser_status',
        description: 'Check if the Gemini browser automation is ready',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'gemini_browser_initialize',
        description: 'Initialize the Gemini browser automation',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'gemini_browser_close',
        description: 'Close the Gemini browser',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }
  /**
   * Get available tools
   */
  getTools() {
    return this.tools;
  }
  /**
   * Execute a tool call
   */
  async executeTool(toolCall) {
    try {
      switch (toolCall.name) {
        case 'gemini_browser_prompt':
          return await this.handlePrompt(toolCall.arguments);
        case 'gemini_browser_status':
          return this.handleStatus();
        case 'gemini_browser_initialize':
          return await this.handleInitialize();
        case 'gemini_browser_close':
          return await this.handleClose();
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${toolCall.name}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing ${toolCall.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
  /**
   * Handle prompt tool call
   */
  async handlePrompt(args) {
    const request = {
      prompt: args.prompt,
      contextUrls: args.contextUrls,
      timeout: args.timeout,
    };
    const response = await geminiBrowser.prompt(request);
    if (!response.success) {
      return {
        content: [
          {
            type: 'text',
            text: `Gemini browser error: ${response.error}`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: response.response,
        },
      ],
    };
  }
  /**
   * Handle status check
   */
  handleStatus() {
    const isReady = geminiBrowser.isReady();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ready: isReady,
            status: isReady ? 'initialized' : 'not initialized',
          }),
        },
      ],
    };
  }
  /**
   * Handle initialization
   */
  async handleInitialize() {
    const success = await geminiBrowser.initialize();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success,
            message: success
              ? 'Gemini browser initialized successfully'
              : 'Failed to initialize Gemini browser',
          }),
        },
      ],
      isError: !success,
    };
  }
  /**
   * Handle close
   */
  async handleClose() {
    await geminiBrowser.close();
    return {
      content: [
        {
          type: 'text',
          text: 'Gemini browser closed successfully',
        },
      ],
    };
  }
}
// Export singleton instance
export const geminiBrowserMCP = new GeminiBrowserMCPServer();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2VtaW5pQnJvd3Nlck1DUFNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkdlbWluaUJyb3dzZXJNQ1BTZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0dBS0c7QUFFSCxPQUFPLEVBQUUsYUFBYSxFQUF1QixNQUFNLDJCQUEyQixDQUFDO0FBeUIvRSxNQUFNLE9BQU8sc0JBQXNCO0lBQW5DO1FBQ1UsVUFBSyxHQUFjO1lBQ3pCO2dCQUNFLElBQUksRUFBRSx1QkFBdUI7Z0JBQzdCLFdBQVcsRUFDVCxpTUFBaU07Z0JBQ25NLFdBQVcsRUFBRTtvQkFDWCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1YsTUFBTSxFQUFFOzRCQUNOLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSw4QkFBOEI7eUJBQzVDO3dCQUNELFdBQVcsRUFBRTs0QkFDWCxJQUFJLEVBQUUsT0FBTzs0QkFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFOzRCQUN6QixXQUFXLEVBQUUscUVBQXFFO3lCQUNuRjt3QkFDRCxPQUFPLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLG1EQUFtRDt5QkFDakU7cUJBQ0Y7b0JBQ0QsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUNyQjthQUNGO1lBQ0Q7Z0JBQ0UsSUFBSSxFQUFFLHVCQUF1QjtnQkFDN0IsV0FBVyxFQUFFLGlEQUFpRDtnQkFDOUQsV0FBVyxFQUFFO29CQUNYLElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxFQUFFO2lCQUNmO2FBQ0Y7WUFDRDtnQkFDRSxJQUFJLEVBQUUsMkJBQTJCO2dCQUNqQyxXQUFXLEVBQUUsMENBQTBDO2dCQUN2RCxXQUFXLEVBQUU7b0JBQ1gsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFLEVBQUU7aUJBQ2Y7YUFDRjtZQUNEO2dCQUNFLElBQUksRUFBRSxzQkFBc0I7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LGdCQUFnQjtRQUM1QixNQUFNLE9BQU8sR0FBRyxNQUFNLGFBQWEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUVqRCxPQUFPO1lBQ0wsT0FBTyxFQUFFO2dCQUNQO29CQUNFLElBQUksRUFBRSxNQUFNO29CQUNaLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO3dCQUNuQixPQUFPO3dCQUNQLE9BQU8sRUFBRSxPQUFPOzRCQUNkLENBQUMsQ0FBQyx5Q0FBeUM7NEJBQzNDLENBQUMsQ0FBQyxxQ0FBcUM7cUJBQzFDLENBQUM7aUJBQ0g7YUFDRjtZQUNELE9BQU8sRUFBRSxDQUFDLE9BQU87U0FDbEIsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyxXQUFXO1FBQ3ZCLE1BQU0sYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRTVCLE9BQU87WUFDTCxPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsSUFBSSxFQUFFLE1BQU07b0JBQ1osSUFBSSxFQUFFLG9DQUFvQztpQkFDM0M7YUFDRjtTQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFFRCw0QkFBNEI7QUFDNUIsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHZW1pbmkgQnJvd3NlciBNQ1AgU2VydmVyXG4gKlxuICogRXhwb3NlcyBHZW1pbmkgYnJvd3NlciBhdXRvbWF0aW9uIGFzIE1DUCB0b29sc1xuICogQWxsb3dzIGFueSBUTkYgYWdlbnQgdG8gZGVsZWdhdGUgdGFza3MgdG8gZnJlZSBHZW1pbmkgY29tcHV0ZVxuICovXG5cbmltcG9ydCB7IGdlbWluaUJyb3dzZXIsIEdlbWluaVByb21wdFJlcXVlc3QgfSBmcm9tICcuL0dlbWluaUJyb3dzZXJBdXRvbWF0aW9uJztcblxuZXhwb3J0IGludGVyZmFjZSBNQ1BUb29sIHtcbiAgbmFtZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBpbnB1dFNjaGVtYToge1xuICAgIHR5cGU6IHN0cmluZztcbiAgICBwcm9wZXJ0aWVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAgIHJlcXVpcmVkPzogc3RyaW5nW107XG4gIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTUNQVG9vbENhbGwge1xuICBuYW1lOiBzdHJpbmc7XG4gIGFyZ3VtZW50czogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNQ1BUb29sUmVzcG9uc2Uge1xuICBjb250ZW50OiBBcnJheTx7XG4gICAgdHlwZTogc3RyaW5nO1xuICAgIHRleHQ6IHN0cmluZztcbiAgfT47XG4gIGlzRXJyb3I/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgR2VtaW5pQnJvd3Nlck1DUFNlcnZlciB7XG4gIHByaXZhdGUgdG9vbHM6IE1DUFRvb2xbXSA9IFtcbiAgICB7XG4gICAgICBuYW1lOiAnZ2VtaW5pX2Jyb3dzZXJfcHJvbXB0JyxcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcIlNlbmQgYSBwcm9tcHQgdG8gQ2hyb21lJ3MgYnVpbHQtaW4gR2VtaW5pIEFJLiBHZW1pbmkgY2FuIHNlZSB0YWIgY29udGVudHMgYW5kIGFjY2VzcyB0aGUgaW50ZXJuZXQuIFVzZSB0aGlzIGZvciB3ZWIgcmVzZWFyY2gsIGNvbnRlbnQgYW5hbHlzaXMsIG9yIGFueSB0YXNrIHRoYXQgYmVuZWZpdHMgZnJvbSBmcmVlIEFJIGNvbXB1dGUuXCIsXG4gICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHByb21wdDoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBwcm9tcHQgdG8gc2VuZCB0byBHZW1pbmknLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29udGV4dFVybHM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcHRpb25hbCBVUkxzIHRvIG9wZW4gaW4gdGFicyBmb3IgR2VtaW5pIHRvIGFuYWx5emUgKHVwIHRvIDEwIHRhYnMpJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRpbWVvdXQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSZXNwb25zZSB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcyAoZGVmYXVsdDogMzAwMDApJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydwcm9tcHQnXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiAnZ2VtaW5pX2Jyb3dzZXJfc3RhdHVzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2hlY2sgaWYgdGhlIEdlbWluaSBicm93c2VyIGF1dG9tYXRpb24gaXMgcmVhZHknLFxuICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHt9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdnZW1pbmlfYnJvd3Nlcl9pbml0aWFsaXplJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnSW5pdGlhbGl6ZSB0aGUgR2VtaW5pIGJyb3dzZXIgYXV0b21hdGlvbicsXG4gICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge30sXG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ2dlbWluaV9icm93c2VyX2Nsb3NlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvc2UgdGhlIEdlbWluaSBicm93c2VyJyxcbiAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICAgIH0sXG4gICAgfSxcbiAgXTtcblxuICAvKipcbiAgICogR2V0IGF2YWlsYWJsZSB0b29sc1xuICAgKi9cbiAgZ2V0VG9vbHMoKTogTUNQVG9vbFtdIHtcbiAgICByZXR1cm4gdGhpcy50b29scztcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGEgdG9vbCBjYWxsXG4gICAqL1xuICBhc3luYyBleGVjdXRlVG9vbCh0b29sQ2FsbDogTUNQVG9vbENhbGwpOiBQcm9taXNlPE1DUFRvb2xSZXNwb25zZT4ge1xuICAgIHRyeSB7XG4gICAgICBzd2l0Y2ggKHRvb2xDYWxsLm5hbWUpIHtcbiAgICAgICAgY2FzZSAnZ2VtaW5pX2Jyb3dzZXJfcHJvbXB0JzpcbiAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVQcm9tcHQodG9vbENhbGwuYXJndW1lbnRzKTtcblxuICAgICAgICBjYXNlICdnZW1pbmlfYnJvd3Nlcl9zdGF0dXMnOlxuICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVN0YXR1cygpO1xuXG4gICAgICAgIGNhc2UgJ2dlbWluaV9icm93c2VyX2luaXRpYWxpemUnOlxuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUluaXRpYWxpemUoKTtcblxuICAgICAgICBjYXNlICdnZW1pbmlfYnJvd3Nlcl9jbG9zZSc6XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlQ2xvc2UoKTtcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICAgICAgdGV4dDogYFVua25vd24gdG9vbDogJHt0b29sQ2FsbC5uYW1lfWAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgaXNFcnJvcjogdHJ1ZSxcbiAgICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgdGV4dDogYEVycm9yIGV4ZWN1dGluZyAke3Rvb2xDYWxsLm5hbWV9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgaXNFcnJvcjogdHJ1ZSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBwcm9tcHQgdG9vbCBjYWxsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGhhbmRsZVByb21wdChhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxNQ1BUb29sUmVzcG9uc2U+IHtcbiAgICBjb25zdCByZXF1ZXN0OiBHZW1pbmlQcm9tcHRSZXF1ZXN0ID0ge1xuICAgICAgcHJvbXB0OiBhcmdzLnByb21wdCxcbiAgICAgIGNvbnRleHRVcmxzOiBhcmdzLmNvbnRleHRVcmxzLFxuICAgICAgdGltZW91dDogYXJncy50aW1lb3V0LFxuICAgIH07XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGdlbWluaUJyb3dzZXIucHJvbXB0KHJlcXVlc3QpO1xuXG4gICAgaWYgKCFyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgdGV4dDogYEdlbWluaSBicm93c2VyIGVycm9yOiAke3Jlc3BvbnNlLmVycm9yfWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgaXNFcnJvcjogdHJ1ZSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICB0ZXh0OiByZXNwb25zZS5yZXNwb25zZSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgc3RhdHVzIGNoZWNrXG4gICAqL1xuICBwcml2YXRlIGhhbmRsZVN0YXR1cygpOiBNQ1BUb29sUmVzcG9uc2Uge1xuICAgIGNvbnN0IGlzUmVhZHkgPSBnZW1pbmlCcm93c2VyLmlzUmVhZHkoKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50OiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgdGV4dDogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcmVhZHk6IGlzUmVhZHksXG4gICAgICAgICAgICBzdGF0dXM6IGlzUmVhZHkgPyAnaW5pdGlhbGl6ZWQnIDogJ25vdCBpbml0aWFsaXplZCcsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGluaXRpYWxpemF0aW9uXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGhhbmRsZUluaXRpYWxpemUoKTogUHJvbWlzZTxNQ1BUb29sUmVzcG9uc2U+IHtcbiAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgZ2VtaW5pQnJvd3Nlci5pbml0aWFsaXplKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudDogW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgIHRleHQ6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICBtZXNzYWdlOiBzdWNjZXNzXG4gICAgICAgICAgICAgID8gJ0dlbWluaSBicm93c2VyIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgICAgOiAnRmFpbGVkIHRvIGluaXRpYWxpemUgR2VtaW5pIGJyb3dzZXInLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGlzRXJyb3I6ICFzdWNjZXNzLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGNsb3NlXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGhhbmRsZUNsb3NlKCk6IFByb21pc2U8TUNQVG9vbFJlc3BvbnNlPiB7XG4gICAgYXdhaXQgZ2VtaW5pQnJvd3Nlci5jbG9zZSgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICB0ZXh0OiAnR2VtaW5pIGJyb3dzZXIgY2xvc2VkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG4gIH1cbn1cblxuLy8gRXhwb3J0IHNpbmdsZXRvbiBpbnN0YW5jZVxuZXhwb3J0IGNvbnN0IGdlbWluaUJyb3dzZXJNQ1AgPSBuZXcgR2VtaW5pQnJvd3Nlck1DUFNlcnZlcigpO1xuIl19
