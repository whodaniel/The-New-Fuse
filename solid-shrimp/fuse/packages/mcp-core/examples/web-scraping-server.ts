/**
 * Web Scraping MCP Server Example
 * 
 * Demonstrates how to create an MCP server with web scraping capabilities
 * for AI agents to access the internet.
 */

import { MCPServer } from '../src/server/MCPServer';
import { MCPServerConfig } from '../src/types/server';
import { LogLevel } from '../src/types/common';
import { WebScrapingMCPTools } from '../../web-scraping/src/mcp/WebScrapingMCPTools';

async function createWebScrapingMCPServer() {
  // Create server instance
  const server = new MCPServer();

  // Configure server
  const config: MCPServerConfig = {
    name: 'web-scraping-mcp-server',
    version: '1.0.0',
    port: 3005,
    host: 'localhost',
    maxConnections: 50,
    timeout: 60000, // Longer timeout for web scraping
    enableAuth: true,
    enableTLS: false,
    logLevel: LogLevel.INFO
  };

  try {
    // Start the server
    await server.start(config);
    console.log('✅ Web Scraping MCP Server started successfully');

    // Initialize web scraping tools with security policy
    const webTools = new WebScrapingMCPTools({
      // Security configuration
      allowedDomains: [
        'wikipedia.org',
        'github.com',
        'stackoverflow.com',
        'news.ycombinator.com',
        'reddit.com',
        'medium.com'
      ],
      blockedDomains: [
        'facebook.com',
        'twitter.com' // Block social media for privacy
      ],
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      rateLimit: {
        requests: 30,
        windowMs: 60000 // 30 requests per minute
      },
      contentFiltering: true
    });

    // Register all web scraping tools
    const tools = webTools.getTools();
    tools.forEach(tool => {
      server.registerTool(tool);
      console.log(`📋 Registered tool: ${tool.name}`);
    });

    // Register a web content resource
    server.registerResource({
      uri: 'web://content',
      name: 'Web Content Resource',
      description: 'Access to web content through scraping',
      handler: {
        async read(uri: string) {
          const url = uri.replace('web://', 'https://');
          
          // Use the web scraping service
          const result = await webTools['webScrapingService'].scrapeAuto(url, {
            timeout: 15000
          }, {
            mainContentOnly: true,
            maxTextLength: 10000
          });

          return {
            uri,
            mimeType: 'text/plain',
            content: result.success ? result.text || '' : `Error: ${result.error}`,
            metadata: {
              title: result.title,
              description: result.description,
              url: result.url,
              timestamp: new Date().toISOString(),
              success: result.success
            }
          };
        }
      }
    });

    console.log('📋 Registered web content resource');

    // Display server information
    const serverInfo = server.getServerInfo();
    console.log('📊 Server Info:', {
      name: serverInfo.name,
      version: serverInfo.version,
      status: serverInfo.status,
      capabilities: serverInfo.capabilities,
      toolCount: serverInfo.metadata?.toolCount
    });

    // Test web scraping functionality
    console.log('\n🧪 Testing web scraping tools...');

    // Test simple scraping
    const simpleTest = await server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'scrape_website_simple',
        arguments: {
          url: 'https://example.com',
          extraction: {
            mainContentOnly: true,
            maxTextLength: 500
          }
        }
      }
    });

    if (simpleTest.result?.success) {
      console.log('✅ Simple scraping test passed');
      console.log('📄 Title:', simpleTest.result.result.title);
      console.log('📝 Text preview:', simpleTest.result.result.text?.substring(0, 100) + '...');
    } else {
      console.log('❌ Simple scraping test failed:', simpleTest.error);
    }

    // Test proxy functionality
    const proxyTest = await server.handleRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'proxy_web_request',
        arguments: {
          url: 'https://httpbin.org/json',
          method: 'GET'
        }
      }
    });

    if (proxyTest.result?.success) {
      console.log('✅ Proxy test passed');
      console.log('📊 Status:', proxyTest.result.result.statusCode);
    } else {
      console.log('❌ Proxy test failed:', proxyTest.error);
    }

    // Test website analysis
    const analysisTest = await server.handleRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'analyze_website',
        arguments: {
          url: 'https://news.ycombinator.com',
          includeScreenshot: false
        }
      }
    });

    if (analysisTest.result?.success) {
      console.log('✅ Website analysis test passed');
      console.log('📊 Analysis:', {
        title: analysisTest.result.result.title,
        wordCount: analysisTest.result.result.wordCount,
        linkCount: analysisTest.result.result.linkCount,
        loadTime: analysisTest.result.result.loadTime
      });
    } else {
      console.log('❌ Website analysis test failed:', analysisTest.error);
    }

    console.log('\n✅ All tests completed!');

    // Display usage examples
    console.log('\n📖 Usage Examples:');
    console.log('1. Simple scraping:');
    console.log('   POST /tools/call');
    console.log('   {"name": "scrape_website_simple", "arguments": {"url": "https://example.com"}}');
    
    console.log('\n2. Full browser scraping:');
    console.log('   POST /tools/call');
    console.log('   {"name": "scrape_website_full", "arguments": {"url": "https://spa-app.com", "config": {"waitForSelector": ".content"}}}');
    
    console.log('\n3. Proxy request:');
    console.log('   POST /tools/call');
    console.log('   {"name": "proxy_web_request", "arguments": {"url": "https://api.example.com", "method": "GET"}}');

    // Keep server running
    console.log('\n⏳ Server running... Press Ctrl+C to stop');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      await webTools.cleanup();
      await server.stop();
      console.log('✅ Server stopped gracefully');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    if (server.isRunning()) {
      await server.stop();
    }
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  createWebScrapingMCPServer().catch(console.error);
}

export { createWebScrapingMCPServer };