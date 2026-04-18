/**
 * Server-Sent Events Controller for Web Scraping
 * 
 * Provides streaming updates for long-running scraping operations
 * using SSE for better browser compatibility than WebSockets.
 */

import { Controller, Get, Query, Logger, Sse, MessageEvent } from '@nestjs/common';
import { Observable, Subject, interval, takeUntil, mergeMap } from 'rxjs';
import { WebScrapingService } from '../core/WebScrapingService.js';
import { ProxyService } from '../proxy/ProxyService.js';
import { ScrapingResult } from '../types/index.js';

interface StreamingSession {
  id: string;
  startTime: Date;
  status: 'active' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
    current?: string;
  };
}

@Controller('web-scraping/stream')
export class WebScrapingSSEController {
  private readonly logger = new Logger(WebScrapingSSEController.name);
  private activeSessions = new Map<string, StreamingSession>();
  private sessionSubjects = new Map<string, Subject<MessageEvent>>();

  constructor(
    private readonly webScrapingService: WebScrapingService,
    private readonly proxyService: ProxyService
  ) {}

  /**
   * Stream scraping progress for a batch of URLs
   */
  @Sse('batch-scraping')
  streamBatchScraping(
    @Query('urls') urlsParam: string,
    @Query('method') method: 'simple' | 'full' | 'auto' = 'auto',
    @Query('sessionId') sessionId?: string
  ): Observable<MessageEvent> {
    try {
      const urls = JSON.parse(urlsParam) as string[];
      const currentSessionId = sessionId || `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create session
      const session: StreamingSession = {
        id: currentSessionId,
        startTime: new Date(),
        status: 'active',
        progress: {
          total: urls.length,
          completed: 0,
          failed: 0
        }
      };

      this.activeSessions.set(currentSessionId, session);
      
      // Create subject for this session
      const subject = new Subject<MessageEvent>();
      this.sessionSubjects.set(currentSessionId, subject);

      // Start scraping process
      this.processBatchScraping(urls, method, currentSessionId, subject);

      // Return observable that emits session events
      return subject.asObservable();

    } catch (error) {
      this.logger.error('Failed to start batch scraping stream:', error);
      
      // Return error stream
      return new Observable<MessageEvent>(subscriber => {
        subscriber.next({
          data: JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Failed to start stream'
          })
        } as MessageEvent);
        subscriber.complete();
      });
    }
  }

  /**
   * Stream single URL scraping with detailed progress
   */
  @Sse('single-scraping')
  streamSingleScraping(
    @Query('url') url: string,
    @Query('method') method: 'simple' | 'full' | 'auto' = 'auto',
    @Query('includeScreenshot') includeScreenshot: boolean = false
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>(subscriber => {
      const sessionId = `single_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Send start event
      subscriber.next({
        data: JSON.stringify({
          type: 'started',
          sessionId,
          url,
          method,
          timestamp: new Date()
        })
      } as MessageEvent);

      // Execute scraping
      this.executeSingleScraping(url, method, includeScreenshot)
        .then(result => {
          // Send progress updates during scraping
          subscriber.next({
            data: JSON.stringify({
              type: 'progress',
              sessionId,
              stage: 'processing',
              message: 'Extracting content...'
            })
          } as MessageEvent);

          // Send final result
          subscriber.next({
            data: JSON.stringify({
              type: 'completed',
              sessionId,
              success: result.success,
              result: {
                title: result.title,
                description: result.description,
                text: result.text?.substring(0, 3000), // Limit for SSE
                links: result.links?.slice(0, 15),
                images: result.images?.slice(0, 8),
                statusCode: result.statusCode,
                executionTime: result.metadata?.executionTime,
                screenshot: includeScreenshot ? result.screenshot : undefined
              },
              error: result.error,
              timestamp: new Date()
            })
          } as MessageEvent);

          subscriber.complete();
        })
        .catch(error => {
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              sessionId,
              error: error instanceof Error ? error.message : 'Scraping failed'
            })
          } as MessageEvent);
          subscriber.complete();
        });
    });
  }

  /**
   * Stream proxy requests with response chunks
   */
  @Sse('proxy-streaming')
  streamProxyRequest(
    @Query('url') url: string,
    @Query('method') method: string = 'GET'
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>(subscriber => {
      const sessionId = `proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Send start event
      subscriber.next({
        data: JSON.stringify({
          type: 'proxy_started',
          sessionId,
          url,
          method,
          timestamp: new Date()
        })
      } as MessageEvent);

      // Execute proxy request
      this.proxyService.proxyRequest({ url, method: method as any })
        .then(result => {
          // Send headers first
          subscriber.next({
            data: JSON.stringify({
              type: 'proxy_headers',
              sessionId,
              statusCode: result.statusCode,
              headers: result.headers,
              contentType: result.contentType
            })
          } as MessageEvent);

          // Send body in chunks if large
          const body = result.body;
          const chunkSize = 1000; // 1KB chunks for SSE
          
          if (body.length > chunkSize) {
            for (let i = 0; i < body.length; i += chunkSize) {
              const chunk = body.substring(i, i + chunkSize);
              subscriber.next({
                data: JSON.stringify({
                  type: 'proxy_chunk',
                  sessionId,
                  chunk,
                  chunkIndex: Math.floor(i / chunkSize),
                  totalChunks: Math.ceil(body.length / chunkSize)
                })
              } as MessageEvent);
            }
          } else {
            subscriber.next({
              data: JSON.stringify({
                type: 'proxy_body',
                sessionId,
                body
              })
            } as MessageEvent);
          }

          // Send completion
          subscriber.next({
            data: JSON.stringify({
              type: 'proxy_completed',
              sessionId,
              success: result.success,
              executionTime: result.metadata.executionTime,
              error: result.error
            })
          } as MessageEvent);

          subscriber.complete();
        })
        .catch(error => {
          subscriber.next({
            data: JSON.stringify({
              type: 'proxy_error',
              sessionId,
              error: error instanceof Error ? error.message : 'Proxy request failed'
            })
          } as MessageEvent);
          subscriber.complete();
        });
    });
  }

  /**
   * Stream live website monitoring
   */
  @Sse('monitor-website')
  streamWebsiteMonitoring(
    @Query('url') url: string,
    @Query('interval') intervalMs: number = 30000, // 30 seconds default
    @Query('selector') selector?: string
  ): Observable<MessageEvent> {
    const sessionId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stopSubject = new Subject<void>();
    
    return interval(intervalMs).pipe(
      takeUntil(stopSubject),
      mergeMap(async (index) => {
        try {
          // Scrape the website
          const result = await this.webScrapingService.scrapeAuto(url, {
            timeout: 15000
          }, {
            selectors: selector ? [selector] : undefined,
            mainContentOnly: true
          });

          return {
            data: JSON.stringify({
              type: 'monitor_update',
              sessionId,
              index,
              timestamp: new Date(),
              url,
              success: result.success,
              title: result.title,
              text: result.text?.substring(0, 1000),
              statusCode: result.statusCode,
              executionTime: result.metadata?.executionTime,
              error: result.error,
              changes: index > 0 ? 'Content change detection not implemented' : undefined
            })
          } as MessageEvent;
        } catch (error) {
          return {
            data: JSON.stringify({
              type: 'monitor_error',
              sessionId,
              index,
              timestamp: new Date(),
              error: error instanceof Error ? error.message : 'Monitoring failed'
            })
          } as MessageEvent;
        }
      })
    );
  }

  /**
   * Get session status via regular HTTP endpoint
   */
  @Get('session-status')
  getSessionStatus(@Query('sessionId') sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }

    return {
      sessionId: session.id,
      status: session.status,
      startTime: session.startTime,
      progress: session.progress,
      duration: Date.now() - session.startTime.getTime()
    };
  }

  /**
   * Stop a streaming session
   */
  @Get('stop-session')
  stopSession(@Query('sessionId') sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    const subject = this.sessionSubjects.get(sessionId);
    
    if (session) {
      session.status = 'completed';
      this.activeSessions.delete(sessionId);
    }
    
    if (subject) {
      subject.next({
        data: JSON.stringify({
          type: 'session_stopped',
          sessionId,
          timestamp: new Date()
        })
      } as MessageEvent);
      subject.complete();
      this.sessionSubjects.delete(sessionId);
    }

    return { success: true, message: 'Session stopped' };
  }

  /**
   * Private helper methods
   */
  private async processBatchScraping(
    urls: string[],
    method: 'simple' | 'full' | 'auto',
    sessionId: string,
    subject: Subject<MessageEvent>
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Send initial progress
    subject.next({
      data: JSON.stringify({
        type: 'batch_started',
        sessionId,
        totalUrls: urls.length,
        timestamp: new Date()
      })
    } as MessageEvent);

    // Process URLs sequentially to avoid overwhelming
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      session.progress.current = url;

      try {
        // Send progress update
        subject.next({
          data: JSON.stringify({
            type: 'progress',
            sessionId,
            currentIndex: i,
            totalUrls: urls.length,
            currentUrl: url,
            completed: session.progress.completed,
            failed: session.progress.failed
          })
        } as MessageEvent);

        // Execute scraping
        let result: ScrapingResult;
        switch (method) {
          case 'simple':
            result = await this.webScrapingService.scrapeSimple(url);
            break;
          case 'full':
            result = await this.webScrapingService.scrapeFull(url);
            break;
          default:
            result = await this.webScrapingService.scrapeAuto(url);
        }

        if (result.success) {
          session.progress.completed++;
        } else {
          session.progress.failed++;
        }

        // Send individual result
        subject.next({
          data: JSON.stringify({
            type: 'item_completed',
            sessionId,
            url,
            success: result.success,
            title: result.title,
            executionTime: result.metadata?.executionTime,
            error: result.error,
            progress: { ...session.progress }
          })
        } as MessageEvent);

      } catch (error) {
        session.progress.failed++;
        
        subject.next({
          data: JSON.stringify({
            type: 'item_failed',
            sessionId,
            url,
            error: error instanceof Error ? error.message : 'Failed',
            progress: { ...session.progress }
          })
        } as MessageEvent);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Send completion
    session.status = 'completed';
    subject.next({
      data: JSON.stringify({
        type: 'batch_completed',
        sessionId,
        finalStats: {
          total: session.progress.total,
          completed: session.progress.completed,
          failed: session.progress.failed,
          duration: Date.now() - session.startTime.getTime()
        },
        timestamp: new Date()
      })
    } as MessageEvent);

    subject.complete();
    this.activeSessions.delete(sessionId);
    this.sessionSubjects.delete(sessionId);
  }

  private async executeSingleScraping(
    url: string,
    method: 'simple' | 'full' | 'auto',
    includeScreenshot: boolean
  ): Promise<ScrapingResult> {
    const config = includeScreenshot ? { enableJavaScript: true } : {};
    const extraction = { includeMetadata: includeScreenshot };

    switch (method) {
      case 'simple':
        return await this.webScrapingService.scrapeSimple(url, config, extraction);
      case 'full':
        return await this.webScrapingService.scrapeFull(url, config, extraction);
      default:
        return await this.webScrapingService.scrapeAuto(url, config, extraction);
    }
  }
}