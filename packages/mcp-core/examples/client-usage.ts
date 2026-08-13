/**
 * Example usage of MCPClient
 * 
 * This example demonstrates how to use the MCPClient to connect to an MCP server,
 * access resources, call tools, and handle notifications.
 */

import { MCPClient } from '../src/client/MCPClient.js';
import { MCPClientConfig } from '../src/types/client.js';

async function main() {
  // Configure the client
  const config: MCPClientConfig = {
    name: 'example-client',
    version: '1.0.0',
    timeout: 30000,
    retryPolicy: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000
    },
    options: {
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 5000
    }
  };

  // Create client instance
  const client = new MCPClient(config);

  try {
    // Connect to MCP server
    console.log('Connecting to MCP server...');
    await client.connect('ws://localhost:8080');
    console.log('Connected successfully!');

    // Get server capabilities
    console.log('\nGetting server capabilities...');
    const capabilities = await client.getServerCapabilities();
    console.log('Server capabilities:', capabilities.map(c => c.name));

    // List available resources
    console.log('\nListing available resources...');
    const resources = await client.listResources();
    console.log('Available resources:');
    resources.forEach(resource => {
      console.log(`  - ${resource.name} (${resource.uri})`);
    });

    // Read a specific resource
    if (resources.length > 0) {
      console.log('\nReading first resource...');
      const content = await client.readResource(resources[0].uri);
      console.log('Resource content:', {
        uri: content.uri,
        mimeType: content.mimeType,
        contentLength: content.content.toString().length
      });

      // Read the same resource again (should be cached)
      console.log('\nReading same resource again (cached)...');
      const cachedContent = await client.readResource(resources[0].uri);
      console.log('Cached content retrieved');
    }

    // Call a tool
    console.log('\nCalling a tool...');
    try {
      const toolResult = await client.callTool('echo', {
        message: 'Hello from MCP client!'
      });
      console.log('Tool result:', toolResult);
    } catch (error) {
      console.log('Tool call failed (tool may not exist):', error.message);
    }

    // Subscribe to notifications
    console.log('\nSubscribing to notifications...');
    const subscriptionId = client.subscribeToMethod('server/status', (notification) => {
      console.log('Received status notification:', notification.params);
    });

    // Subscribe to all notifications
    client.subscribeToNotifications((notification) => {
      console.log('Received notification:', notification.method, notification.params);
    });

    // Send a notification to the server
    console.log('\nSending notification to server...');
    await client.sendNotification({
      jsonrpc: '2.0',
      method: 'client/hello',
      params: {
        message: 'Hello from client',
        timestamp: new Date().toISOString()
      }
    });

    // Wait for a specific notification (with timeout)
    console.log('\nWaiting for server response notification...');
    try {
      const responseNotification = await client.waitForNotification('server/response', 5000);
      console.log('Received expected notification:', responseNotification);
    } catch (error) {
      console.log('Timeout waiting for notification:', error.message);
    }

    // Get client statistics
    console.log('\nClient statistics:');
    const stats = client.getStatistics();
    console.log({
      totalRequests: stats.totalRequests,
      successfulRequests: stats.successfulRequests,
      failedRequests: stats.failedRequests,
      averageResponseTime: stats.averageResponseTime,
      activeConnections: stats.activeConnections
    });

    // Get cache statistics
    console.log('\nCache statistics:');
    const cacheStats = client.getCacheStatistics();
    console.log({
      totalEntries: cacheStats.totalEntries,
      hitCount: cacheStats.hitCount,
      missCount: cacheStats.missCount,
      hitRate: cacheStats.hitRate
    });

    // Ping the server
    console.log('\nPinging server...');
    const pingTime = await client.ping();
    console.log(`Server responded in ${pingTime}ms`);

    // Unsubscribe from notifications
    client.unsubscribe(subscriptionId);
    console.log('Unsubscribed from status notifications');

    // Wait a bit to see any final notifications
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up
    console.log('\nCleaning up...');
    await client.cleanup();
    console.log('Client cleaned up successfully');
  }
}

// Example of using client with error handling and reconnection
async function robustClientExample() {
  const config: MCPClientConfig = {
    name: 'robust-client',
    version: '1.0.0',
    timeout: 10000,
    retryPolicy: {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 30000
    },
    options: {
      enableCaching: true,
      autoReconnect: true,
      maxReconnectAttempts: 10,
      reconnectInterval: 5000
    }
  };

  const client = new MCPClient(config);

  // Enable auto-reconnection
  client.enableAutoReconnect();

  // Set up event handlers
  client.on('connected', (endpoint) => {
    console.log(`Connected to ${endpoint}`);
  });

  client.on('disconnected', () => {
    console.log('Disconnected from server');
  });

  client.on('reconnected', (endpoint, attempt) => {
    console.log(`Reconnected to ${endpoint} after ${attempt} attempts`);
  });

  client.on('reconnectFailed', (endpoint, attempt, error) => {
    console.log(`Reconnection attempt ${attempt} failed:`, error.message);
  });

  client.on('reconnectGiveUp', (endpoint, maxAttempts) => {
    console.log(`Gave up reconnecting to ${endpoint} after ${maxAttempts} attempts`);
  });

  client.on('error', (error) => {
    console.error('Client error:', error);
  });

  try {
    await client.connect('ws://localhost:8080');

    // Perform operations with automatic retry and caching
    const performOperations = async () => {
      try {
        // These operations will be retried automatically on failure
        const resources = await client.listResources();
        console.log(`Found ${resources.length} resources`);

        if (resources.length > 0) {
          const content = await client.readResource(resources[0].uri);
          console.log(`Read resource: ${content.uri}`);
        }

        const toolResult = await client.callTool('system/health', {});
        console.log('System health:', toolResult);

      } catch (error) {
        console.error('Operation failed:', error.message);
      }
    };

    // Perform operations periodically
    const interval = setInterval(performOperations, 10000);

    // Run for 60 seconds
    setTimeout(() => {
      clearInterval(interval);
      client.cleanup();
    }, 60000);

  } catch (error) {
    console.error('Failed to connect:', error);
    await client.cleanup();
  }
}

// Run the examples
if (require.main === module) {
  console.log('=== Basic MCP Client Example ===');
  main().then(() => {
    console.log('\n=== Robust MCP Client Example ===');
    return robustClientExample();
  }).catch(console.error);
}

export { main as basicClientExample, robustClientExample };