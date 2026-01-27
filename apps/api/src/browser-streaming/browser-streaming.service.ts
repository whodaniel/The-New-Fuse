/**
 * Browser Streaming Service
 *
 * Manages headless browser instances and streams their visual output
 * to the AI Command Center dashboard via WebSocket.
 *
 * Features:
 * - Multiple concurrent browser sessions (one per AI endpoint)
 * - Real-time screenshot streaming to canvas
 * - Command injection from Master Clock orchestrator
 * - Session persistence and recovery
 * - Memory-efficient frame compression
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Browser, Page } from 'playwright';
import { chromium } from 'playwright';

export interface BrowserSession {
  id: string;
  name: string;
  url: string;
  page: Page | null;
  browser: Browser | null;
  status: 'initializing' | 'running' | 'error' | 'stopped';
  lastFrame?: string; // Base64 encoded screenshot
  lastUpdate: Date;
  viewportWidth: number;
  viewportHeight: number;
}

export interface BrowserCommand {
  sessionId: string;
  type: 'navigate' | 'click' | 'type' | 'scroll' | 'execute';
  payload: any;
}

export interface StreamFrame {
  sessionId: string;
  frame: string; // Base64 encoded image
  timestamp: number;
  width: number;
  height: number;
}

@Injectable()
export class BrowserStreamingService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserStreamingService.name);
  private sessions = new Map<string, BrowserSession>();
  private streamingIntervals = new Map<string, NodeJS.Timeout>();
  private readonly FRAME_RATE = 2; // 2 FPS for reasonable performance
  private readonly JPEG_QUALITY = 70; // Compression quality

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Create a new browser session for an AI endpoint
   */
  async createSession(
    id: string,
    name: string,
    url: string,
    viewportWidth = 800,
    viewportHeight = 600
  ): Promise<BrowserSession> {
    this.logger.log(`Creating browser session: ${id} (${name})`);

    // Check if session already exists
    if (this.sessions.has(id)) {
      this.logger.warn(`Session ${id} already exists, stopping old session`);
      await this.stopSession(id);
    }

    const session: BrowserSession = {
      id,
      name,
      url,
      page: null,
      browser: null,
      status: 'initializing',
      lastUpdate: new Date(),
      viewportWidth,
      viewportHeight,
    };

    this.sessions.set(id, session);

    try {
      // Launch browser with optimized settings
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security', // Allow cross-origin
          '--disable-features=IsolateOrigins,site-per-process',
        ],
      });

      const context = await browser.newContext({
        viewport: { width: viewportWidth, height: viewportHeight },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        bypassCSP: true,
      });

      const page = await context.newPage();

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      session.browser = browser;
      session.page = page;
      session.status = 'running';
      session.lastUpdate = new Date();

      this.logger.log(`✅ Browser session ${id} created successfully`);

      // Start streaming frames
      this.startStreaming(id);

      return session;
    } catch (error) {
      this.logger.error(`Failed to create session ${id}:`, error);
      session.status = 'error';
      throw error;
    }
  }

  /**
   * Start streaming frames from a browser session
   */
  private startStreaming(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.page) {
      this.logger.warn(
        `Cannot start streaming for ${sessionId}: session not found or page not ready`
      );
      return;
    }

    // Clear any existing interval
    this.stopStreaming(sessionId);

    // Stream at configured FPS
    const interval = setInterval(async () => {
      try {
        await this.captureAndEmitFrame(sessionId);
      } catch (error) {
        this.logger.error(`Error capturing frame for ${sessionId}:`, error);
      }
    }, 1000 / this.FRAME_RATE);

    this.streamingIntervals.set(sessionId, interval);
    this.logger.log(`🎥 Started streaming for ${sessionId} at ${this.FRAME_RATE} FPS`);
  }

  /**
   * Stop streaming frames
   */
  private stopStreaming(sessionId: string): void {
    const interval = this.streamingIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.streamingIntervals.delete(sessionId);
      this.logger.log(`⏸️ Stopped streaming for ${sessionId}`);
    }
  }

  /**
   * Capture screenshot and emit via WebSocket
   */
  private async captureAndEmitFrame(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.page || session.status !== 'running') {
      return;
    }

    try {
      // Capture screenshot as base64 JPEG
      const screenshot = await session.page.screenshot({
        type: 'jpeg',
        quality: this.JPEG_QUALITY,
      });

      const base64Frame = screenshot.toString('base64');
      session.lastFrame = base64Frame;
      session.lastUpdate = new Date();

      // Emit frame via EventEmitter (WebSocket gateway will listen)
      const frame: StreamFrame = {
        sessionId,
        frame: base64Frame,
        timestamp: Date.now(),
        width: session.viewportWidth,
        height: session.viewportHeight,
      };

      this.eventEmitter.emit('browser.frame', frame);
    } catch (error) {
      this.logger.error(`Failed to capture frame for ${sessionId}:`, error);
      session.status = 'error';
    }
  }

  /**
   * Execute a command on a browser session
   */
  async executeCommand(command: BrowserCommand): Promise<void> {
    const session = this.sessions.get(command.sessionId);
    if (!session || !session.page) {
      throw new Error(`Session ${command.sessionId} not found or not ready`);
    }

    const { page } = session;

    this.logger.log(`Executing command on ${command.sessionId}: ${command.type}`);

    try {
      switch (command.type) {
        case 'navigate':
          await page.goto(command.payload.url, { waitUntil: 'networkidle' });
          break;

        case 'click':
          await page.click(command.payload.selector);
          break;

        case 'type':
          await page.fill(command.payload.selector, command.payload.text);
          break;

        case 'scroll':
          await page.evaluate((y) => window.scrollTo(0, y), command.payload.y);
          break;

        case 'execute':
          await page.evaluate(command.payload.script);
          break;

        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }

      this.logger.log(`✅ Command executed successfully on ${command.sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to execute command on ${command.sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Send synchronized message to all AI sessions (Master Clock orchestration)
   */
  async broadcastToAll(message: string): Promise<void> {
    this.logger.log(`📡 Broadcasting message to all ${this.sessions.size} sessions`);

    const promises: Promise<void>[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'running' && session.page) {
        promises.push(
          this.executeCommand({
            sessionId,
            type: 'type',
            payload: {
              selector: 'textarea, input[type="text"]', // Common AI chat input selectors
              text: message,
            },
          }).catch((error) => {
            this.logger.error(`Failed to broadcast to ${sessionId}:`, error);
          })
        );
      }
    }

    await Promise.allSettled(promises);
    this.logger.log(`✅ Broadcast complete`);
  }

  /**
   * Get session status
   */
  getSession(id: string): BrowserSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): BrowserSession[] {
    return Array.from(this.sessions.values()).map((session) => ({
      ...session,
      page: null, // Don't serialize page object
      browser: null, // Don't serialize browser object
    }));
  }

  /**
   * Stop a browser session
   */
  async stopSession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) {
      this.logger.warn(`Session ${id} not found`);
      return;
    }

    this.logger.log(`Stopping session ${id}`);

    // Stop streaming
    this.stopStreaming(id);

    // Close browser
    if (session.browser) {
      try {
        await session.browser.close();
      } catch (error) {
        this.logger.error(`Error closing browser for ${id}:`, error);
      }
    }

    session.status = 'stopped';
    this.sessions.delete(id);

    this.logger.log(`✅ Session ${id} stopped`);
  }

  /**
   * Stop all sessions
   */
  async stopAllSessions(): Promise<void> {
    this.logger.log(`Stopping all ${this.sessions.size} sessions`);

    const promises = Array.from(this.sessions.keys()).map((id) => this.stopSession(id));

    await Promise.allSettled(promises);
    this.logger.log(`✅ All sessions stopped`);
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    await this.stopAllSessions();
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    const sessions = this.getAllSessions();
    return {
      totalSessions: sessions.length,
      runningSessions: sessions.filter((s) => s.status === 'running').length,
      errorSessions: sessions.filter((s) => s.status === 'error').length,
      stoppedSessions: sessions.filter((s) => s.status === 'stopped').length,
      frameRate: this.FRAME_RATE,
      sessions: sessions.map((s) => ({
        id: s.id,
        name: s.name,
        url: s.url,
        status: s.status,
        lastUpdate: s.lastUpdate,
      })),
    };
  }
}
