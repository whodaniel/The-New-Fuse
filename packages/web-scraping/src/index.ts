/**
 * Web Scraping Package - Main Export
 * 
 * Provides comprehensive web scraping and proxy capabilities for AI agents
 */

// Core services
export { WebScrapingService } from './core/WebScrapingService.js';
export { ProxyService } from './proxy/ProxyService.js';

// MCP integration
export { WebScrapingMCPTools } from './mcp/WebScrapingMCPTools.js';

// WebSocket and streaming
export { WebScrapingWebSocketGateway } from './websocket/WebScrapingWebSocketGateway.js';
export { WebScrapingSSEController } from './streaming/WebScrapingSSEController.js';

// Electron integration
// Temporarily disabled - Electron is a non-SAAS framework component moved to separate branch
// export { ElectronWebScrapingBridge } from './electron/ElectronWebScrapingBridge.js';

// Types and interfaces
export * from './types/index.js';

// Re-export for convenience
export type {
  WebScrapingConfig,
  ScrapingResult,
  ContentExtractionOptions,
  ProxyRequest,
  ProxyResponse,
  BrowserSession,
  SecurityPolicy
} from './types/index.js';