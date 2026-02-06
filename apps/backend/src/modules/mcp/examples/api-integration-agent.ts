/**
 * API Integration Agent Example
 *
 * This agent integrates with external APIs and shares data with other agents.
 * It demonstrates:
 * - External API calls
 * - Data fetching and caching
 * - Cross-agent data sharing
 * - Error handling and retry logic
 */

import { Logger } from '@nestjs/common';
import { MCPClient } from '@the-new-fuse/mcp-core/client';

export class APIIntegrationAgent {
  private readonly logger = new Logger(APIIntegrationAgent.name);
  private client: MCPClient;
  private agentId: string;
  private cache = new Map<string, any>();

  constructor(agentId: string, serverEndpoint: string) {
    this.agentId = agentId;
    this.client = new MCPClient({
      name: `api-integrator-${agentId}`,
      version: '1.0.0',
      timeout: 30000,
    });

    this.client.connect(serverEndpoint);
  }

  /**
   * Fetch data from external API
   */
  async fetchExternalData(apiUrl: string, params?: any): Promise<any> {
    this.logger.log(`Fetching data from: ${apiUrl}`);

    // Check cache first
    const cacheKey = `${apiUrl}:${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      this.logger.debug('Returning cached data');
      return this.cache.get(cacheKey);
    }

    try {
      // Use resource tool to fetch data
      const response = await this.client.callTool('resource.read', {
        uri: `external://${apiUrl}`,
      });

      const data = response.result;

      // Cache the result
      this.cache.set(cacheKey, data);

      this.logger.log('Data fetched successfully');
      return data;
    } catch (error) {
      this.logger.error('Failed to fetch external data:', error);
      throw error;
    }
  }

  /**
   * Process API response and share with other agents
   */
  async processAndShare(
    apiUrl: string,
    targetAgents: string[],
    transformations?: string[]
  ): Promise<any> {
    this.logger.log('Processing API response and sharing with agents');

    // Fetch data
    const rawData = await this.fetchExternalData(apiUrl);

    // Request data processing agent to transform data
    const processingAgent = await this.findAgentByCapability('data_transformation');

    if (processingAgent) {
      // Send data to processing agent
      const transformedData = await this.requestDataTransformation(
        processingAgent.id,
        rawData,
        transformations || ['normalize', 'validate']
      );

      // Share transformed data with target agents
      await this.shareData(targetAgents, transformedData);

      return transformedData;
    } else {
      // No processing agent available, share raw data
      await this.shareData(targetAgents, rawData);
      return rawData;
    }
  }

  /**
   * Find agent by capability
   */
  private async findAgentByCapability(capability: string): Promise<any> {
    const response = await this.client.callTool('agent.discover', {
      capability,
      status: 'active',
    });

    const agents = response.result.agents || [];
    return agents.length > 0 ? agents[0] : null;
  }

  /**
   * Request data transformation from another agent
   */
  private async requestDataTransformation(
    processorAgentId: string,
    data: any,
    transformations: string[]
  ): Promise<any> {
    this.logger.log(`Requesting data transformation from ${processorAgentId}`);

    // Create a task for the processing agent
    const taskResponse = await this.client.callTool('task.create', {
      title: 'Transform API data',
      description: 'Apply transformations to fetched API data',
      assignedTo: processorAgentId,
      priority: 'normal',
      metadata: {
        transformations,
        dataSize: JSON.stringify(data).length,
      },
    });

    const taskId = taskResponse.result.taskId;

    // Send the data to the agent
    await this.client.callTool('agent.message', {
      targetAgent: processorAgentId,
      message: {
        taskId,
        taskType: 'data_transformation',
        parameters: {
          data,
          transformations,
        },
      },
      messageType: 'request',
      requiresResponse: true,
    });

    // Wait for task completion
    const result = await this.waitForTaskCompletion(taskId);

    return result.result;
  }

  /**
   * Wait for task completion
   */
  private async waitForTaskCompletion(taskId: string, maxAttempts = 30): Promise<any> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const statusResponse = await this.client.callTool('task.status', {
        taskId,
      });

      const status = statusResponse.result.status;

      if (status === 'completed') {
        return statusResponse.result;
      } else if (status === 'failed') {
        throw new Error(`Task failed: ${taskId}`);
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error(`Task timeout: ${taskId}`);
  }

  /**
   * Share data with other agents
   */
  private async shareData(targetAgents: string[], data: any): Promise<void> {
    this.logger.log(`Sharing data with ${targetAgents.length} agents`);

    await this.client.callTool('communication.broadcast', {
      message: {
        type: 'api_data_available',
        source: this.agentId,
        data,
        timestamp: new Date().toISOString(),
      },
      targets: targetAgents,
      priority: 'normal',
    });
  }

  /**
   * Subscribe to data updates from external source
   */
  async subscribeToUpdates(
    apiUrl: string,
    pollInterval: number,
    callback: (data: any) => void
  ): Promise<() => void> {
    this.logger.log(`Subscribing to updates from: ${apiUrl}`);

    // Subscribe to events
    await this.client.callTool('communication.subscribe', {
      eventType: 'external_api_update',
      filter: { apiUrl },
    });

    // Start polling
    const intervalId = setInterval(async () => {
      try {
        const data = await this.fetchExternalData(apiUrl);
        callback(data);
      } catch (error) {
        this.logger.error('Error fetching update:', error);
      }
    }, pollInterval);

    // Return unsubscribe function
    return () => {
      clearInterval(intervalId);
      this.logger.log('Unsubscribed from updates');
    };
  }

  /**
   * Handle API errors with retry logic
   */
  async fetchWithRetry(apiUrl: string, maxRetries = 3, backoffMs = 1000): Promise<any> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.fetchExternalData(apiUrl);
      } catch (error) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt + 1} failed, retrying...`);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
        }
      }
    }

    throw new Error(
      `Failed after ${maxRetries} retries: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`
    );
  }

  /**
   * Get agent status
   */
  async getStatus(): Promise<any> {
    return {
      agentId: this.agentId,
      type: 'api_integrator',
      status: 'active',
      cacheSize: this.cache.size,
      capabilities: ['api_integration', 'data_fetching', 'external_communication'],
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
    this.logger.log('API integration agent disconnected');
  }
}

/**
 * Example usage
 */
export async function runAPIIntegrationExample(): Promise<void> {
  const agent = new APIIntegrationAgent('api_integrator_001', 'ws://localhost:3100');

  try {
    // Fetch and process data
    const result = await agent.processAndShare(
      'https://api.example.com/data',
      ['data_processor_001', 'coordinator_001'],
      ['normalize', 'validate']
    );

    console.log('API integration completed:', result);

    // Subscribe to updates
    const unsubscribe = await agent.subscribeToUpdates(
      'https://api.example.com/stream',
      5000,
      (data) => {
        console.log('Update received:', data);
      }
    );

    // Unsubscribe after 30 seconds
    setTimeout(() => {
      unsubscribe();
    }, 30000);
  } catch (error) {
    console.error('API integration failed:', error);
  } finally {
    // Keep connection open for subscriptions
    // await agent.disconnect();
  }
}
