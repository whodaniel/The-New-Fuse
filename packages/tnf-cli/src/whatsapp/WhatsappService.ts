import * as dotenv from 'dotenv';
import * as crypto from 'node:crypto';
import * as http from 'node:http';
import { join } from 'path';
import { LLMClient, LLMMessage } from '../utils/llm-client.js';
import { createSimpleLogger } from '../utils/simple-logger.js';

export class WhatsappService {
  private readonly repoRoot: string;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private llmClient: LLMClient | null = null;
  private readonly logger: any;
  private readonly port: number;
  private server: http.Server | null = null;
  private messagesProcessed: number = 0;

  constructor(repoRoot: string, port?: number) {
    this.repoRoot = repoRoot;
    this.logger = createSimpleLogger('whatsapp-service');

    // Load environment variables from .env.tnf-whatsapp
    const envPath = join(repoRoot, '.env.tnf-whatsapp');
    try {
      dotenv.config({ path: envPath });
      this.logger.info('Loaded environment from .env.tnf-whatsapp');
    } catch (error) {
      this.logger.warn('Could not load .env.tnf-whatsapp file');
    }

    this.port = port ?? parseInt(process.env.TNF_WHATSAPP_WEBHOOK_PORT || '3001', 10);
  }

  async initializeLLM(): Promise<void> {
    try {
      this.llmClient = await LLMClient.create('worker');
      this.logger.info('LLM Client initialized');
    } catch (error: any) {
      this.logger.error('Failed to initialize LLM client:', error.message);
    }
  }

  private async processWithAI(userMessage: string): Promise<string> {
    if (!this.llmClient) {
      await this.initializeLLM();
    }
    if (!this.llmClient) return 'AI service unavailable.';

    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content:
            'You are TNF (The New Fuse), a helpful AI assistant connected to WhatsApp. Keep responses concise — WhatsApp messages have a 4096 character limit.',
        },
        { role: 'user', content: userMessage },
      ];
      return await this.llmClient.chatComplete(messages, { temperature: 0.7, maxTokens: 500 });
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * Verify Meta webhook signature (X-Hub-Signature-256).
   * Returns true if no app secret is configured (degraded mode).
   */
  private verifySignature(payload: string, signature: string | undefined): boolean {
    const appSecret = process.env.TNF_WHATSAPP_APP_SECRET;
    if (!appSecret) return true; // No secret = degraded mode, accept all

    if (!signature || !signature.startsWith('sha256=')) return false;

    const expected =
      'sha256=' + crypto.createHmac('sha256', appSecret).update(payload, 'utf8').digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'));
  }

  /**
   * Parse a Meta webhook payload and extract text messages.
   */
  private extractMessages(body: any): Array<{ from: string; text: string; messageId: string }> {
    const messages: Array<{ from: string; text: string; messageId: string }> = [];
    try {
      const entries = body?.entry ?? [];
      for (const entry of entries) {
        for (const change of entry?.changes ?? []) {
          const value = change?.value;
          if (!value?.messages) continue;
          for (const msg of value.messages) {
            if (msg.type === 'text' && msg.text?.body) {
              messages.push({
                from: msg.from,
                text: msg.text.body,
                messageId: msg.id,
              });
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.error('Error parsing webhook payload:', err.message);
    }
    return messages;
  }

  async start(): Promise<void> {
    if (this.isRunning) throw new Error('WhatsApp service is already running');

    const token = process.env.TNF_WHATSAPP_TOKEN;
    const verifyToken = process.env.TNF_WHATSAPP_VERIFY_TOKEN || 'tnf-webhook-verify';

    if (!token) {
      this.logger.warn(
        'Missing TNF_WHATSAPP_TOKEN — starting in dry-run mode (will log but not reply)'
      );
    }

    await this.initializeLLM();

    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${this.port}`);

      // --- GET: Meta webhook verification (challenge-response) ---
      if (req.method === 'GET' && url.pathname === '/webhook') {
        const mode = url.searchParams.get('hub.mode');
        const challenge = url.searchParams.get('hub.challenge');
        const tokenParam = url.searchParams.get('hub.verify_token');

        if (mode === 'subscribe' && tokenParam === verifyToken && challenge) {
          this.logger.info('Webhook verification succeeded');
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(challenge);
        } else {
          this.logger.warn('Webhook verification failed — token mismatch');
          res.writeHead(403);
          res.end('Forbidden');
        }
        return;
      }

      // --- POST: Incoming messages ---
      if (req.method === 'POST' && url.pathname === '/webhook') {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', async () => {
          const rawBody = Buffer.concat(chunks).toString('utf8');

          // Signature verification
          const signature = req.headers['x-hub-signature-256'] as string | undefined;
          if (!this.verifySignature(rawBody, signature)) {
            this.logger.error('Webhook signature verification FAILED — rejecting');
            res.writeHead(401);
            res.end('Unauthorized');
            return;
          }

          // Always respond 200 quickly to Meta (they retry on timeout)
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));

          // Process messages asynchronously
          let body: any;
          try {
            body = JSON.parse(rawBody);
          } catch {
            this.logger.error('Invalid JSON in webhook payload');
            return;
          }

          const incomingMessages = this.extractMessages(body);
          for (const msg of incomingMessages) {
            this.messagesProcessed++;
            this.logger.info(`Message from ${msg.from}: ${msg.text.substring(0, 80)}`);

            if (!token) {
              this.logger.info('[dry-run] Would reply to:', msg.from);
              continue;
            }

            try {
              const reply = await this.processWithAI(msg.text);
              await this.sendMessage(msg.from, reply);
            } catch (err: any) {
              this.logger.error(`Failed to reply to ${msg.from}:`, err.message);
            }
          }
        });
        return;
      }

      // --- Health check ---
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
        const status = await this.getStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.listen(this.port, () => {
        this.isRunning = true;
        this.startTime = Date.now();
        this.logger.info(`WhatsApp webhook listening on port ${this.port}`);
        this.logger.info(`  Webhook URL: http://localhost:${this.port}/webhook`);
        this.logger.info(`  Health check: http://localhost:${this.port}/health`);
        if (!token) this.logger.warn('  ⚠ Running in dry-run mode (no TNF_WHATSAPP_TOKEN)');
        resolve();
      });
      this.server!.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.logger.info('Stopping WhatsApp service');

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = null;
    }

    this.isRunning = false;
    this.logger.info('WhatsApp service stopped');
  }

  async getStatus(): Promise<{
    isRunning: boolean;
    uptime?: number;
    messagesProcessed?: number;
    port?: number;
  }> {
    const uptime = this.isRunning ? Math.floor((Date.now() - this.startTime) / 1000) : undefined;
    return {
      isRunning: this.isRunning,
      uptime,
      messagesProcessed: this.messagesProcessed,
      port: this.isRunning ? this.port : undefined,
    };
  }

  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    const token = process.env.TNF_WHATSAPP_TOKEN;
    const phoneId = process.env.TNF_WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      this.logger.warn(
        `[dry-run] Simulating message to ${phoneNumber}: ${message.substring(0, 80)}`
      );
      return;
    }

    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API error: ${response.status} ${errorText}`);
    }

    this.logger.info(`Message sent to ${phoneNumber}`);
  }
}
