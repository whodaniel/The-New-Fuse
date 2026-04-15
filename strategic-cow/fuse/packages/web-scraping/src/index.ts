/**
 * Web Scraping Package - Main Export
 * 
 * Provides comprehensive web scraping and proxy capabilities for AI agents
 */

// Core services
export { WebScrapingService } from './core/WebScrapingService';
export { ProxyService } from './proxy/ProxyService';

// MCP integration
export { WebScrapingMCPTools } from './mcp/WebScrapingMCPTools';

// WebSocket and streaming
export { WebScrapingWebSocketGateway } from './websocket/WebScrapingWebSocketGateway';
export { WebScrapingSSEController } from './streaming/WebScrapingSSEController';

// Electron integration
// Temporarily disabled - Electron is a non-SAAS framework component moved to separate branch
// export { ElectronWebScrapingBridge } from './electron/ElectronWebScrapingBridge';

// Types and interfaces
export * from './types';

// Re-export for convenience
export type {
  WebScrapingConfig,
  ScrapingResult,
  ContentExtractionOptions,
  ProxyRequest,
  ProxyResponse,
  BrowserSession,
  SecurityPolicy
} from './types';