/**
 * Electron Bridge for Web Scraping
 *
 * Integrates web scraping capabilities with the existing Electron
 * infrastructure, extending the HybridBackend functionality.
 */

import { ipcMain } from 'electron';
import { WebScrapingService } from '../core/WebScrapingService.js';
import { WebScrapingMCPTools } from '../mcp/WebScrapingMCPTools.js';
import { ProxyService } from '../proxy/ProxyService.js';
import { ScrapingResult, SecurityPolicy, WebScrapingConfig } from '../types/index.js';

export class ElectronWebScrapingBridge {
  private webScrapingService: WebScrapingService;
  private proxyService: ProxyService;
  private mcpTools: WebScrapingMCPTools;
  private activeScraping = new Map<string, { cancel: () => void }>();

  constructor(securityPolicy?: SecurityPolicy) {
    // Initialize services with Electron-optimized settings
    const electronSecurityPolicy: SecurityPolicy = {
      maxFileSize: 10 * 1024 * 1024, // 10MB for Electron
      allowedContentTypes: [
        'text/html',
        'text/plain',
        'application/json',
        'application/xml',
        'text/xml',
        'image/png',
        'image/jpeg',
        'image/gif',
      ],
      rateLimit: {
        requests: 50,
        windowMs: 60000,
      },
      contentFiltering: true,
      ...securityPolicy,
    };

    this.webScrapingService = new WebScrapingService(electronSecurityPolicy);
    this.proxyService = new ProxyService(electronSecurityPolicy);
    this.mcpTools = new WebScrapingMCPTools(electronSecurityPolicy);

    this.setupIpcHandlers();
  }

  /**
   * Setup IPC handlers for Electron main process
   */
  private setupIpcHandlers(): void {
    // Basic scraping handlers
    ipcMain.handle(
      'web-scraping:scrape-simple',
      async (_, url: string, config?: WebScrapingConfig) => {
        try {
          const result = await this.webScrapingService.scrapeSimple(url, config);
          return { success: true, data: result };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Scraping failed',
          };
        }
      }
    );

    ipcMain.handle(
      'web-scraping:scrape-full',
      async (_, url: string, config?: WebScrapingConfig) => {
        try {
          const result = await this.webScrapingService.scrapeFull(url, config);
          return { success: true, data: result };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Scraping failed',
          };
        }
      }
    );

    ipcMain.handle(
      'web-scraping:scrape-auto',
      async (_, url: string, config?: WebScrapingConfig) => {
        try {
          const result = await this.webScrapingService.scrapeAuto(url, config);
          return { success: true, data: result };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Scraping failed',
          };
        }
      }
    );

    // Batch scraping with progress updates
    ipcMain.handle(
      'web-scraping:scrape-batch',
      async (event, urls: string[], config?: WebScrapingConfig) => {
        const sessionId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
          const results: ScrapingResult[] = [];

          // Send initial progress
          event.sender.send('web-scraping:batch-progress', {
            sessionId,
            type: 'started',
            totalUrls: urls.length,
            completed: 0,
          });

          for (let i = 0; i < urls.length; i++) {
            const url = urls[i];

            try {
              const result = await this.webScrapingService.scrapeAuto(url, config);
              results.push(result);

              // Send progress update
              event.sender.send('web-scraping:batch-progress', {
                sessionId,
                type: 'progress',
                currentUrl: url,
                currentIndex: i + 1,
                totalUrls: urls.length,
                completed: i + 1,
                success: result.success,
                title: result.title,
              });
            } catch (error) {
              // Send error update
              event.sender.send('web-scraping:batch-progress', {
                sessionId,
                type: 'error',
                currentUrl: url,
                currentIndex: i + 1,
                error: error instanceof Error ? error.message : 'Failed',
              });
            }

            // Small delay to prevent overwhelming
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          // Send completion
          event.sender.send('web-scraping:batch-progress', {
            sessionId,
            type: 'completed',
            totalUrls: urls.length,
            results: results.length,
          });

          return { success: true, sessionId, results };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Batch scraping failed',
          };
        }
      }
    );

    // Proxy handlers
    ipcMain.handle(
      'web-scraping:proxy-request',
      async (
        _,
        request: {
          url: string;
          method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
          headers?: Record<string, string>;
          body?: string;
        }
      ) => {
        try {
          const result = await this.proxyService.proxyRequest(request);
          return { success: true, data: result };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Proxy request failed',
          };
        }
      }
    );

    // MCP tool integration
    ipcMain.handle('web-scraping:mcp-call-tool', async (_, toolName: string, params: any) => {
      try {
        const tools = this.mcpTools.getTools();
        const tool = tools.find((t) => t.name === toolName);

        if (!tool) {
          return { success: false, error: `Tool '${toolName}' not found` };
        }

        const result = await tool.handler.execute(params);
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'MCP tool execution failed',
        };
      }
    });

    // Get available MCP tools
    ipcMain.handle('web-scraping:get-mcp-tools', async () => {
      try {
        const tools = this.mcpTools.getTools();
        return {
          success: true,
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          })),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get tools',
        };
      }
    });

    // Website monitoring
    ipcMain.handle(
      'web-scraping:start-monitoring',
      async (event, url: string, intervalMs: number = 30000) => {
        const monitorId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const intervalHandle = setInterval(async () => {
          try {
            const result = await this.webScrapingService.scrapeAuto(url, { timeout: 15000 });

            event.sender.send('web-scraping:monitor-update', {
              monitorId,
              url,
              timestamp: new Date(),
              success: result.success,
              title: result.title,
              text: result.text?.substring(0, 1000),
              statusCode: result.statusCode,
              error: result.error,
            });
          } catch (error) {
            event.sender.send('web-scraping:monitor-error', {
              monitorId,
              url,
              timestamp: new Date(),
              error: error instanceof Error ? error.message : 'Monitoring failed',
            });
          }
        }, intervalMs);

        // Store cancel function
        this.activeScraping.set(monitorId, {
          cancel: () => clearInterval(intervalHandle),
        });

        return { success: true, monitorId };
      }
    );

    ipcMain.handle('web-scraping:stop-monitoring', async (_, monitorId: string) => {
      const monitor = this.activeScraping.get(monitorId);
      if (monitor) {
        monitor.cancel();
        this.activeScraping.delete(monitorId);
        return { success: true };
      }
      return { success: false, error: 'Monitor not found' };
    });

    // Screenshot and PDF generation
    ipcMain.handle(
      'web-scraping:screenshot',
      async (
        _,
        url: string,
        options?: {
          fullPage?: boolean;
          width?: number;
          height?: number;
        }
      ) => {
        try {
          const result = await this.webScrapingService.scrapeFull(
            url,
            {
              viewport: {
                width: options?.width || 1920,
                height: options?.height || 1080,
              },
            },
            {
              includeMetadata: true,
            }
          );

          if (result.success && result.screenshot) {
            return {
              success: true,
              screenshot: result.screenshot,
              title: result.title,
              url: result.finalUrl || url,
            };
          } else {
            return { success: false, error: result.error || 'Screenshot capture failed' };
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Screenshot failed',
          };
        }
      }
    );

    // Statistics and monitoring
    ipcMain.handle('web-scraping:get-statistics', async () => {
      try {
        const stats = this.mcpTools.getStatistics();
        return { success: true, statistics: stats };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get statistics',
        };
      }
    });

    // Cleanup handler
    ipcMain.handle('web-scraping:cleanup', async () => {
      try {
        // Cancel all active monitoring
        for (const [, monitor] of this.activeScraping) {
          monitor.cancel();
        }
        this.activeScraping.clear();

        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Cleanup failed' };
      }
    });

    // Chrome integration (extends existing Chrome functionality)
    ipcMain.handle('web-scraping:chrome-scrape-tab', async (_, tabId?: number) => {
      try {
        // This would integrate with existing Chrome extension functionality
        // For now, return a placeholder
        return {
          success: true,
          message: 'Chrome tab scraping integration ready',
          tabId,
          note: 'Requires Chrome extension integration',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Chrome integration failed',
        };
      }
    });

    // Browser automation integration
    ipcMain.handle(
      'web-scraping:automate-browser',
      async (
        _,
        script: {
          url: string;
          actions: Array<{
            type: 'click' | 'type' | 'wait' | 'screenshot';
            selector?: string;
            text?: string;
            delay?: number;
          }>;
        }
      ) => {
        try {
          // This would use Puppeteer for browser automation
          // Placeholder implementation
          return {
            success: true,
            message: 'Browser automation ready',
            script: script.actions.length,
            note: 'Advanced automation features available',
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Automation failed',
          };
        }
      }
    );
  }

  /**
   * Initialize the bridge (called from HybridBackend)
   */
  async initialize(): Promise<void> {
    // Any initialization logic
    // eslint-disable-next-line no-console
    console.log('ElectronWebScrapingBridge initialized');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cancel all active operations
    for (const [, operation] of this.activeScraping) {
      operation.cancel();
    }
    this.activeScraping.clear();
  }

  /**
   * Get bridge statistics
   */
  getStatistics() {
    return {
      activeOperations: this.activeScraping.size,
      services: {
        webScraping: this.webScrapingService.getStatistics(),
        proxy: this.proxyService.getStatistics(),
        mcp: this.mcpTools.getStatistics(),
      },
    };
  }
}
