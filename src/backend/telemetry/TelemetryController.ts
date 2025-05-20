import { Controller, Post, Body, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { TelemetryWorker, TelemetryType, TelemetryData } from './TelemetryWorker.js';

/**
 * Controller for handling telemetry data from clients
 */
@Controller('api/telemetry')
export class TelemetryController {
  private telemetryWorker: TelemetryWorker;

  constructor() {
    // Initialize the telemetry worker with environment variables
    this.telemetryWorker = new TelemetryWorker({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      enableLangfuse: process.env.ENABLE_LANGFUSE === 'true',
      langfusePublicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
      langfuseSecretKey: process.env.LANGFUSE_SECRET_KEY || '',
      langfuseHost: process.env.LANGFUSE_HOST || 'https://langfuse.com',
    });
  }

  /**
   * Receive telemetry events from clients
   */
  @Post('events')
  async receiveEvents(@Body() payload: { events: TelemetryData[] }) {
    try {
      const { events } = payload;
      
      if (!Array.isArray(events)) {
        throw new HttpException('Invalid payload: events must be an array', HttpStatus.BAD_REQUEST);
      }
      
      // Process each event
      const promises = events.map(event => this.telemetryWorker.process(event));
      await Promise.all(promises);
      
      return { success: true, processed: events.length };
    } catch (error) {
      throw new HttpException(
        `Failed to process telemetry events: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get recent agent activity
   */
  @Get('agents/activity')
  async getAgentActivity() {
    try {
      const redisClient = this.telemetryWorker['redisClient'];
      if (!redisClient) {
        throw new Error('Redis client not available');
      }
      
      // Get all agent statuses
      const agentStatusMap = await redisClient.hGetAll('agents:status');
      
      // Convert to array
      const agents = Object.entries(agentStatusMap).map(([agentId, status]) => ({
        agentId,
        status
      }));
      
      // Get recent tools for each agent
      const recentTools = await Promise.all(
        agents.map(async agent => {
          const recentToolsJson = await redisClient.lRange(`metrics:agent:${agent.agentId}:recent_tools`, 0, 9);
          return recentToolsJson.map(json => JSON.parse(json));
        })
      );
      
      // Add recent tools to agents
      agents.forEach((agent, index) => {
        agent['recentTools'] = recentTools[index];
      });
      
      return { agents };
    } catch (error) {
      throw new HttpException(
        `Failed to get agent activity: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get tool usage metrics
   */
  @Get('tools/usage')
  async getToolUsage(@Query('limit') limitStr = '20') {
    try {
      const limit = parseInt(limitStr, 10);
      const redisClient = this.telemetryWorker['redisClient'];
      if (!redisClient) {
        throw new Error('Redis client not available');
      }
      
      // Get tool usage from Redis (sorted by count)
      const toolKeys = await redisClient.keys('metrics:tool:*:count');
      
      // Get counts for each tool
      const toolCounts = await Promise.all(
        toolKeys.map(async key => {
          const count = await redisClient.get(key);
          const toolId = key.split(':')[2];
          return { toolId, count: parseInt(count || '0', 10) };
        })
      );
      
      // Sort by count and limit
      const sortedTools = toolCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      return { tools: sortedTools };
    } catch (error) {
      throw new HttpException(
        `Failed to get tool usage: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get recent traces
   */
  @Get('traces/recent')
  async getRecentTraces(@Query('limit') limitStr = '20') {
    try {
      const limit = parseInt(limitStr, 10);
      const redisClient = this.telemetryWorker['redisClient'];
      if (!redisClient) {
        throw new Error('Redis client not available');
      }
      
      // Get recent traces from Redis sorted set
      const recentTraceIds = await redisClient.zRange('index:trace:by_time', 0, limit - 1, {
        REV: true
      });
      
      // Get trace details
      const traces = await Promise.all(
        recentTraceIds.map(async id => {
          const traceJson = await redisClient.get(`trace:${id}`);
          return traceJson ? JSON.parse(traceJson) : null;
        })
      );
      
      // Filter out nulls
      const validTraces = traces.filter(trace => trace !== null);
      
      return { traces: validTraces };
    } catch (error) {
      throw new HttpException(
        `Failed to get recent traces: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}