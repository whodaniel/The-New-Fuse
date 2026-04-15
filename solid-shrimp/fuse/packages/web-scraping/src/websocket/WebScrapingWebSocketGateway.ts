/**
 * WebSocket Gateway for Real-Time Web Scraping
 * 
 * Integrates with existing WebSocket infrastructure to provide
 * real-time scraping updates and streaming capabilities.
 */

import { Injectable, Logger } from '@nestjs/common';
import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  ConnectedSocket, 
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebScrapingService } from '../core/WebScrapingService';
import { ProxyService } from '../proxy/ProxyService';
import { WebScrapingConfig, ScrapingResult } from '../types';

interface ScrapingSession {
  id: string;
  userId?: string;
  tenantId?: string;
  startTime: Date;
  status: 'active' | 'paused' | 'completed' | 'failed';
  results: ScrapingResult[];
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  namespace: '/web-scraping'
})
@Injectable()
export class WebScrapingWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebScrapingWebSocketGateway.name);
  private activeSessions = new Map<string, ScrapingSession>();
  private clientSessions = new Map<string, string>(); // socketId -> sessionId

  constructor(
    private readonly webScrapingService: WebScrapingService,
    private readonly proxyService: ProxyService
  ) {}

  /**
   * Handle client connection
   */
  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    this.logger.log(`Web scraping client connected: ${client.id}`);
    
    // Send welcome message with available commands
    client.emit('scraping_connected', {
      message: 'Connected to web scraping service',
      availableCommands: [
        'start_scraping_session',
        'scrape_url',
        'scrape_batch',
        'proxy_request',
        'get_session_status',
        'pause_session',
        'resume_session',
        'stop_session'
      ]
    });
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(@ConnectedSocket() client: Socket): Promise<void> {
    const sessionId = this.clientSessions.get(client.id);
    if (sessionId) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = 'paused';
        this.logger.log(`Paused scraping session ${sessionId} due to client disconnect`);
      }
      this.clientSessions.delete(client.id);
    }
    
    this.logger.log(`Web scraping client disconnected: ${client.id}`);
  }

  /**
   * Start a new scraping session
   */
  @SubscribeMessage('start_scraping_session')
  async handleStartSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string; tenantId?: string }
  ): Promise<void> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: ScrapingSession = {
        id: sessionId,
        userId: data.userId,
        tenantId: data.tenantId,
        startTime: new Date(),
        status: 'active',
        results: []
      };

      this.activeSessions.set(sessionId, session);
      this.clientSessions.set(client.id, sessionId);

      client.emit('session_started', {
        sessionId,
        status: 'active',
        startTime: session.startTime
      });

      this.logger.log(`Started scraping session ${sessionId} for client ${client.id}`);
    } catch (error) {
      client.emit('error', { 
        error: error instanceof Error ? error.message : 'Failed to start session' 
      });
    }
  }

  /**
   * Scrape a single URL with real-time updates
   */
  @SubscribeMessage('scrape_url')
  async handleScrapeUrl(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      url: string;
      method?: 'simple' | 'full' | 'auto';
      config?: WebScrapingConfig;
      streamUpdates?: boolean;
    }
  ): Promise<void> {
    const sessionId = this.clientSessions.get(client.id);
    if (!sessionId) {
      client.emit('error', { error: 'No active session. Start a session first.' });
      return;
    }

    try {
      // Send scraping started event
      client.emit('scraping_started', {
        url: data.url,
        method: data.method || 'auto',
        timestamp: new Date()
      });

      let result: ScrapingResult;

      // Execute scraping based on method
      switch (data.method) {
        case 'simple':
          result = await this.webScrapingService.scrapeSimple(
            data.url, 
            data.config || {}, 
            { mainContentOnly: true }
          );
          break;
        case 'full':
          result = await this.webScrapingService.scrapeFull(
            data.url, 
            data.config || {}, 
            { includeMetadata: true }
          );
          break;
        default:
          result = await this.webScrapingService.scrapeAuto(
            data.url, 
            data.config || {}
          );
      }

      // Store result in session
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.results.push(result);
      }

      // Send result to client
      client.emit('scraping_completed', {
        url: data.url,
        success: result.success,
        result: {
          title: result.title,
          description: result.description,
          text: result.text?.substring(0, 2000), // Limit for WebSocket
          links: result.links?.slice(0, 10),
          images: result.images?.slice(0, 5),
          statusCode: result.statusCode,
          executionTime: result.metadata?.executionTime
        },
        error: result.error,
        timestamp: new Date()
      });

    } catch (error) {
      client.emit('scraping_failed', {
        url: data.url,
        error: error instanceof Error ? error.message : 'Scraping failed',
        timestamp: new Date()
      });
    }
  }

  /**
   * Scrape multiple URLs in batch with progress updates
   */
  @SubscribeMessage('scrape_batch')
  async handleScrapeBatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      urls: string[];
      method?: 'simple' | 'full' | 'auto';
      config?: WebScrapingConfig;
      batchSize?: number;
    }
  ): Promise<void> {
    const sessionId = this.clientSessions.get(client.id);
    if (!sessionId) {
      client.emit('error', { error: 'No active session. Start a session first.' });
      return;
    }

    try {
      const { urls, method = 'auto', config = {}, batchSize = 3 } = data;
      
      client.emit('batch_started', {
        totalUrls: urls.length,
        batchSize,
        timestamp: new Date()
      });

      // Process URLs in batches
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        
        // Send batch progress
        client.emit('batch_progress', {
          currentBatch: Math.floor(i / batchSize) + 1,
          totalBatches: Math.ceil(urls.length / batchSize),
          processedUrls: i,
          totalUrls: urls.length,
          currentBatchUrls: batch
        });

        // Process batch concurrently
        const batchPromises = batch.map(async (url) => {
          try {
            let result: ScrapingResult;
            
            switch (method) {
              case 'simple':
                result = await this.webScrapingService.scrapeSimple(url, config);
                break;
              case 'full':
                result = await this.webScrapingService.scrapeFull(url, config);
                break;
              default:
                result = await this.webScrapingService.scrapeAuto(url, config);
            }

            // Send individual result
            client.emit('batch_item_completed', {
              url,
              success: result.success,
              title: result.title,
              executionTime: result.metadata?.executionTime,
              error: result.error
            });

            return result;
          } catch (error) {
            client.emit('batch_item_failed', {
              url,
              error: error instanceof Error ? error.message : 'Failed'
            });
            return null;
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches to prevent overwhelming
        if (i + batchSize < urls.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      client.emit('batch_completed', {
        totalUrls: urls.length,
        completedAt: new Date()
      });

    } catch (error) {
      client.emit('batch_failed', {
        error: error instanceof Error ? error.message : 'Batch scraping failed'
      });
    }
  }

  /**
   * Make a proxy request
   */
  @SubscribeMessage('proxy_request')
  async handleProxyRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<void> {
    try {
      const result = await this.proxyService.proxyRequest({
        url: data.url,
        method: (data.method as any) || 'GET',
        headers: data.headers,
        body: data.body
      });

      client.emit('proxy_response', {
        success: result.success,
        statusCode: result.statusCode,
        headers: result.headers,
        body: result.body.substring(0, 5000), // Limit for WebSocket
        contentType: result.contentType,
        executionTime: result.metadata.executionTime,
        error: result.error
      });

    } catch (error) {
      client.emit('proxy_error', {
        error: error instanceof Error ? error.message : 'Proxy request failed'
      });
    }
  }

  /**
   * Get session status
   */
  @SubscribeMessage('get_session_status')
  async handleGetSessionStatus(@ConnectedSocket() client: Socket): Promise<void> {
    const sessionId = this.clientSessions.get(client.id);
    if (!sessionId) {
      client.emit('session_status', { error: 'No active session' });
      return;
    }

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      client.emit('session_status', { error: 'Session not found' });
      return;
    }

    client.emit('session_status', {
      sessionId: session.id,
      status: session.status,
      startTime: session.startTime,
      resultsCount: session.results.length,
      successfulScrapes: session.results.filter(r => r.success).length,
      failedScrapes: session.results.filter(r => !r.success).length
    });
  }

  /**
   * Pause session
   */
  @SubscribeMessage('pause_session')
  async handlePauseSession(@ConnectedSocket() client: Socket): Promise<void> {
    const sessionId = this.clientSessions.get(client.id);
    if (sessionId) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = 'paused';
        client.emit('session_paused', { sessionId });
      }
    }
  }

  /**
   * Resume session
   */
  @SubscribeMessage('resume_session')
  async handleResumeSession(@ConnectedSocket() client: Socket): Promise<void> {
    const sessionId = this.clientSessions.get(client.id);
    if (sessionId) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = 'active';
        client.emit('session_resumed', { sessionId });
      }
    }
  }

  /**
   * Stop session
   */
  @SubscribeMessage('stop_session')
  async handleStopSession(@ConnectedSocket() client: Socket): Promise<void> {
    const sessionId = this.clientSessions.get(client.id);
    if (sessionId) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = 'completed';
        this.activeSessions.delete(sessionId);
        this.clientSessions.delete(client.id);
        
        client.emit('session_stopped', {
          sessionId,
          finalStats: {
            totalResults: session.results.length,
            successfulScrapes: session.results.filter(r => r.success).length,
            failedScrapes: session.results.filter(r => !r.success).length,
            duration: Date.now() - session.startTime.getTime()
          }
        });
      }
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Get session statistics
   */
  getSessionStatistics() {
    const sessions = Array.from(this.activeSessions.values());
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      pausedSessions: sessions.filter(s => s.status === 'paused').length,
      totalResults: sessions.reduce((sum, s) => sum + s.results.length, 0),
      successfulScrapes: sessions.reduce((sum, s) => 
        sum + s.results.filter(r => r.success).length, 0
      ),
      failedScrapes: sessions.reduce((sum, s) => 
        sum + s.results.filter(r => !r.success).length, 0
      )
    };
  }
}