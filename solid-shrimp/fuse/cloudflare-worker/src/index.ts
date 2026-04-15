/**
 * Business Event Processor Worker - Main Entry Point
 * Handles incoming webhook events and routes them to appropriate business processors
 */

import { BusinessEventProcessor } from './processors/BusinessEventProcessor';
import { WebhookSecurityValidator } from './security/WebhookSecurityValidator';
import { BusinessIntelligenceEngine } from './ai/BusinessIntelligenceEngine';
import { ErrorHandler } from './utils/ErrorHandler';
import { Logger } from './utils/Logger';
import type { Env } from './types/env';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const logger = new Logger(env);
    const errorHandler = new ErrorHandler(logger);

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // CORS headers for all responses
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Signature, X-Webhook-Timestamp',
      };

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      // Health check endpoint
      if (path === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          worker: 'business-event-processor' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Main webhook processing endpoint
      if (path.startsWith('/webhook/') && request.method === 'POST') {
        const source = path.split('/')[2];
        return await this.processWebhook(request, source, env, logger);
      }

      // Business intelligence endpoint
      if (path === '/ai/insights' && request.method === 'POST') {
        return await this.generateInsights(request, env, logger);
      }

      // Analytics endpoint
      if (path === '/analytics/metrics' && request.method === 'GET') {
        return await this.getAnalytics(request, env, logger);
      }

      return new Response('Not Found', { 
        status: 404, 
        headers: corsHeaders 
      });

    } catch (error) {
      return errorHandler.handleError(error, request);
    }
  },

  async processWebhook(request: Request, source: string, env: Env, logger: Logger): Promise<Response> {
    const processor = new BusinessEventProcessor(env, logger);
    const validator = new WebhookSecurityValidator(env, logger);

    try {
      // Validate webhook signature
      const isValid = await validator.validateWebhook(request, source);
      if (!isValid) {
        logger.warn(`Invalid webhook signature from source: ${source}`);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Process the webhook
      const result = await processor.processWebhook(request, source);

      return new Response(JSON.stringify({
        success: true,
        eventId: result.eventId,
        processingStatus: result.status
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      logger.error(`Webhook processing failed for source ${source}:`, error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  async generateInsights(request: Request, env: Env, logger: Logger): Promise<Response> {
    const aiEngine = new BusinessIntelligenceEngine(env, logger);

    try {
      const { organizationId, timeframe } = await request.json();
      const insights = await aiEngine.generateInsights(organizationId, timeframe);

      return new Response(JSON.stringify({
        success: true,
        insights
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      logger.error('AI insights generation failed:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Insights generation failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  async getAnalytics(request: Request, env: Env, logger: Logger): Promise<Response> {
    try {
      const url = new URL(request.url);
      const organizationId = url.searchParams.get('organizationId');
      const timeframe = url.searchParams.get('timeframe') || '24h';

      if (!organizationId) {
        return new Response(JSON.stringify({ error: 'organizationId required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Implement analytics retrieval logic here
      const analytics = {
        totalEvents: 0,
        eventsByType: {},
        eventsBySource: {},
        processingLatency: { avg: 0, p95: 0, p99: 0 },
        errorRate: 0
      };

      return new Response(JSON.stringify({
        success: true,
        analytics
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      logger.error('Analytics retrieval failed:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Analytics retrieval failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};