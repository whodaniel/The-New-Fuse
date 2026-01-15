/**
 * MCP Tools for Web Scraping
 *
 * Provides MCP-compatible tools for AI agents to scrape websites
 * and access the internet with full security and monitoring.
 */

import { ToolResult } from '@the-new-fuse/mcp-core';
import { WebScrapingService } from '../core/WebScrapingService';
import { ProxyService } from '../proxy/ProxyService';
import {
  ContentExtractionOptions,
  ProxyRequest,
  SecurityPolicy,
  WebScrapingConfig,
} from '../types';

/**
 * Simple handler interface for web scraping tools
 */
interface SimpleToolHandler {
  execute: (params: any) => Promise<ToolResult>;
}

export class WebScrapingMCPTools {
  private readonly webScrapingService: WebScrapingService;
  private readonly proxyService: ProxyService;

  constructor(securityPolicy: SecurityPolicy = {}) {
    this.webScrapingService = new WebScrapingService(securityPolicy);
    this.proxyService = new ProxyService(securityPolicy);
  }

  /**
   * Get all web scraping MCP tools
   */
  getTools(): Array<{
    name: string;
    description: string;
    inputSchema: any;
    handler: SimpleToolHandler;
  }> {
    return [
      this.getSimpleScrapeTool(),
      this.getFullScrapeTool(),
      this.getAutoScrapeTool(),
      this.getProxyTool(),
      this.getWebsiteAnalysisTool(),
    ];
  }

  /**
   * Simple web scraping tool (fast, no JavaScript)
   */
  private getSimpleScrapeTool() {
    return {
      name: 'scrape_website_simple',
      description: 'Scrape a website using simple HTTP request (fast, no JavaScript execution)',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to scrape',
          },
          config: {
            type: 'object',
            properties: {
              timeout: { type: 'number', description: 'Request timeout in milliseconds' },
              userAgent: { type: 'string', description: 'User agent string' },
              headers: { type: 'object', description: 'Additional headers' },
            },
          },
          extraction: {
            type: 'object',
            properties: {
              mainContentOnly: { type: 'boolean', description: 'Extract main content only' },
              removeScripts: { type: 'boolean', description: 'Remove scripts and styles' },
              maxTextLength: { type: 'number', description: 'Maximum text length' },
              selectors: {
                type: 'array',
                items: { type: 'string' },
                description: 'CSS selectors to extract specific content',
              },
            },
          },
        },
        required: ['url'],
      },
      handler: {
        execute: async (params: {
          url: string;
          config?: WebScrapingConfig;
          extraction?: ContentExtractionOptions;
        }): Promise<ToolResult> => {
          try {
            const result = await this.webScrapingService.scrapeSimple(
              params.url,
              params.config || {},
              params.extraction || {}
            );

            return {
              success: true,
              result: {
                url: result.url,
                title: result.title,
                description: result.description,
                text: result.text,
                links: result.links?.slice(0, 20), // Limit links
                images: result.images?.slice(0, 10), // Limit images
                statusCode: result.statusCode,
                executionTime: result.metadata?.executionTime,
                method: result.metadata?.method,
              },
              metadata: {
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName: 'scrape_website_simple',
                timestamp: new Date().toISOString(),
                success: result.success,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Scraping failed',
              metadata: {
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName: 'scrape_website_simple',
                timestamp: new Date().toISOString(),
              },
            };
          }
        },
      },
    };
  }

  /**
   * Full web scraping tool (with JavaScript execution)
   */
  private getFullScrapeTool() {
    return {
      name: 'scrape_website_full',
      description: 'Scrape a website with full browser rendering and JavaScript execution',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to scrape',
          },
          config: {
            type: 'object',
            properties: {
              timeout: { type: 'number', description: 'Request timeout in milliseconds' },
              waitForSelector: { type: 'string', description: 'CSS selector to wait for' },
              waitTime: { type: 'number', description: 'Additional wait time in milliseconds' },
              viewport: {
                type: 'object',
                properties: {
                  width: { type: 'number' },
                  height: { type: 'number' },
                },
              },
            },
          },
          extraction: {
            type: 'object',
            properties: {
              mainContentOnly: { type: 'boolean', description: 'Extract main content only' },
              includeScreenshot: { type: 'boolean', description: 'Include page screenshot' },
              maxTextLength: { type: 'number', description: 'Maximum text length' },
              selectors: {
                type: 'array',
                items: { type: 'string' },
                description: 'CSS selectors to extract specific content',
              },
            },
          },
        },
        required: ['url'],
      },
      handler: {
        execute: async (params: {
          url: string;
          config?: WebScrapingConfig;
          extraction?: ContentExtractionOptions;
        }): Promise<ToolResult> => {
          try {
            const result = await this.webScrapingService.scrapeFull(
              params.url,
              { ...params.config, enableJavaScript: true },
              params.extraction || {}
            );

            return {
              success: true,
              result: {
                url: result.url,
                title: result.title,
                description: result.description,
                text: result.text,
                links: result.links?.slice(0, 20),
                images: result.images?.slice(0, 10),
                screenshot: result.screenshot,
                statusCode: result.statusCode,
                executionTime: result.metadata?.executionTime,
                resourcesLoaded: result.metadata?.resourcesLoaded,
                jsErrors: result.metadata?.jsErrors,
                method: result.metadata?.method,
              },
              metadata: {
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName: 'scrape_website_full',
                timestamp: new Date().toISOString(),
                success: result.success,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Full scraping failed',
              metadata: {
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName: 'scrape_website_full',
                timestamp: new Date().toISOString(),
              },
            };
          }
        },
      },
    };
  }

  /**
   * Auto-detect scraping tool (smart method selection)
   */
  private getAutoScrapeTool() {
    return {
      name: 'scrape_website_auto',
      description: 'Automatically choose the best scraping method for the website',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to scrape',
          },
          config: {
            type: 'object',
            properties: {
              timeout: { type: 'number', description: 'Request timeout in milliseconds' },
              preferFast: { type: 'boolean', description: 'Prefer fast method over completeness' },
            },
          },
          extraction: {
            type: 'object',
            properties: {
              mainContentOnly: { type: 'boolean', description: 'Extract main content only' },
              maxTextLength: { type: 'number', description: 'Maximum text length' },
            },
          },
        },
        required: ['url'],
      },
      handler: {
        execute: async (params: {
          url: string;
          config?: WebScrapingConfig;
          extraction?: ContentExtractionOptions;
        }): Promise<ToolResult> => {
          try {
            const result = await this.webScrapingService.scrapeAuto(
              params.url,
              params.config || {},
              params.extraction || {}
            );

            return {
              success: true,
              result: {
                url: result.url,
                title: result.title,
                description: result.description,
                text: result.text,
                links: result.links?.slice(0, 15),
                images: result.images?.slice(0, 8),
                statusCode: result.statusCode,
                executionTime: result.metadata?.executionTime,
                method: result.metadata?.method,
                methodUsed: result.metadata?.method === 'fetch' ? 'simple' : 'full',
              },
              metadata: {
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName: 'scrape_website_auto',
                timestamp: new Date().toISOString(),
                success: result.success,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Auto scraping failed',
              metadata: {
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName: 'scrape_website_auto',
                timestamp: new Date().toISOString(),
              },
            };
          }
        },
      },
    };
  }

  /**
   * Proxy tool for CORS-free requests
   */
  private getProxyTool() {
    return {
      name: 'proxy_web_request',
      description: 'Make a web request through proxy to bypass CORS restrictions',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to request',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'HTTP method',
          },
          headers: {
            type: 'object',
            description: 'Request headers',
          },
          body: {
            type: 'string',
            description: 'Request body (for POST/PUT)',
          },
          config: {
            type: 'object',
            properties: {
              timeout: { type: 'number', description: 'Request timeout in milliseconds' },
            },
          },
        },
        required: ['url'],
      },
      handler: {
        execute: async (params: ProxyRequest): Promise<ToolResult> => {
          try {
            const result = await this.proxyService.proxyRequest(params);

            return {
              success: result.success,
              result: {
                statusCode: result.statusCode,
                headers: result.headers,
                body: result.body,
                contentType: result.contentType,
                executionTime: result.metadata.executionTime,
              },
              error: result.error,
              metadata: {
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName: 'proxy_web_request',
                timestamp: new Date().toISOString(),
                url: result.metadata.url,
                method: result.metadata.method,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Proxy request failed',
              metadata: {
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName: 'proxy_web_request',
                timestamp: new Date().toISOString(),
              },
            };
          }
        },
      },
    };
  }

  /**
   * Website analysis tool
   */
  private getWebsiteAnalysisTool() {
    return {
      name: 'analyze_website',
      description: 'Analyze a website structure and extract comprehensive information',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to analyze',
          },
          includeScreenshot: {
            type: 'boolean',
            description: 'Include a screenshot of the page',
          },
        },
        required: ['url'],
      },
      handler: {
        execute: async (params: {
          url: string;
          includeScreenshot?: boolean;
        }): Promise<ToolResult> => {
          try {
            const result = await this.webScrapingService.scrapeFull(
              params.url,
              { enableJavaScript: true },
              {
                includeMetadata: params.includeScreenshot,
                mainContentOnly: false,
                removeScripts: false,
              }
            );

            // Analyze the content
            const analysis = {
              url: result.url,
              title: result.title,
              description: result.description,
              wordCount: result.text?.split(/\s+/).length || 0,
              linkCount: result.links?.length || 0,
              imageCount: result.images?.length || 0,
              hasJavaScript: result.metadata?.jsErrors !== undefined,
              loadTime: result.metadata?.executionTime,
              resourcesLoaded: result.metadata?.resourcesLoaded,
              screenshot: result.screenshot,
              mainContent:
                result.text?.substring(0, 1000) +
                (result.text && result.text.length > 1000 ? '...' : ''),
              topLinks: result.links?.slice(0, 10),
              topImages: result.images?.slice(0, 5),
            };

            return {
              success: true,
              result: analysis,
              metadata: {
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName: 'analyze_website',
                timestamp: new Date().toISOString(),
                success: result.success,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Website analysis failed',
              metadata: {
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName: 'analyze_website',
                timestamp: new Date().toISOString(),
              },
            };
          }
        },
      },
    };
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      webScraping: this.webScrapingService.getStatistics(),
      proxy: this.proxyService.getStatistics(),
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.proxyService.clearRateLimitData();
  }
}
