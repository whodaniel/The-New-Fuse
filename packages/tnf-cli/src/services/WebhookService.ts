import * as crypto from 'crypto';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';
import {
  accountScopedRoot,
  resolveAccountBinding,
  tryAccountScopedPath,
} from './AccountBindingService.js';

/** Ownership stamp applied to subscription records written to account-scoped storage. */
interface OwnerStamp {
  ownerUserId: string;
  ownerAccountId: string;
}

export interface WebhookSubscription {
  id: string;
  event: string;
  url: string;
  secret?: string;
  active: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggerCount: number;
  failCount: number;
  headers?: Record<string, string>;
  retryCount: number;
  timeout?: number;
  /** Owning TNF account — stamped on write for account-scoped storage. */
  ownerUserId?: string;
  ownerAccountId?: string;
}

export interface WebhookEvent {
  event: string;
  timestamp: string;
  payload: Record<string, any>;
  subscriptionId: string;
  deliveryId: string;
}

export class WebhookService {
  /** Primary storage file: caller-provided verbatim, or account-scoped. */
  private readonly webhooksPath: string;
  /** Legacy flat file (~/.tnf/webhooks.json), used only as a read fallback. */
  private readonly legacyWebhooksPath: string | null;

  constructor(webhooksPath?: string) {
    const legacyPath = path.join(os.homedir(), '.tnf', 'webhooks.json');
    if (webhooksPath && webhooksPath.trim()) {
      // Caller-managed path (tests, explicit overrides) is used verbatim and
      // stays outside account scoping — the caller owns the path decision.
      this.webhooksPath = webhooksPath;
      this.legacyWebhooksPath = null;
    } else {
      // Webhook subscriptions carry signing secrets, so they are personal
      // data owned by the authenticated TNF account: scope storage under
      // ~/.tnf/accounts/<ownerUserId>/. Unbound machines keep reading the
      // legacy flat file; writes fail closed.
      this.webhooksPath = tryAccountScopedPath('webhooks.json') ?? legacyPath;
      this.legacyWebhooksPath = legacyPath;
    }
  }

  private readWebhooks(): WebhookSubscription[] {
    const candidates = [this.webhooksPath];
    if (this.legacyWebhooksPath && this.legacyWebhooksPath !== this.webhooksPath) {
      candidates.push(this.legacyWebhooksPath);
    }
    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue;
      try {
        const data = fs.readFileSync(candidate, 'utf8');
        return JSON.parse(data);
      } catch {
        // Malformed file — try the next candidate before defaults
      }
    }
    return this.getDefaultWebhooks();
  }

  private writeWebhooks(webhooks: WebhookSubscription[]): void {
    // Fail closed on writes: without an authenticated account there is no
    // owner to attribute webhook signing secrets to, so refuse instead of
    // falling back to the legacy machine-wide flat file.
    let target = this.webhooksPath;
    let owner: OwnerStamp | null = null;
    if (this.legacyWebhooksPath !== null) {
      try {
        const binding = resolveAccountBinding();
        target = path.join(accountScopedRoot(), 'webhooks.json');
        owner = { ownerUserId: binding.ownerUserId, ownerAccountId: binding.tnfAccountId };
      } catch (err) {
        throw new Error(`Cannot save webhooks: ${(err as Error).message}`);
      }
    }
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    const stamped = owner ? webhooks.map((w) => ({ ...w, ...owner })) : webhooks;
    fs.writeFileSync(target, JSON.stringify(stamped, null, 2), { mode: 0o600 });
  }

  async list(): Promise<WebhookSubscription[]> {
    return this.readWebhooks();
  }

  async add(
    event: string,
    url: string,
    options: {
      secret?: string;
      description?: string;
      headers?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<WebhookSubscription> {
    const webhooks = this.readWebhooks();
    const id = `wh-${Date.now().toString(36)}`;

    const subscription: WebhookSubscription = {
      id,
      event,
      url,
      secret: options.secret,
      active: true,
      description: options.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: 0,
      failCount: 0,
      headers: options.headers,
      retryCount: 3,
      timeout: options.timeout || 30000,
    };

    webhooks.push(subscription);
    this.writeWebhooks(webhooks);
    return subscription;
  }

  async remove(id: string): Promise<void> {
    const webhooks = this.readWebhooks();
    const index = webhooks.findIndex((w) => w.id === id);

    if (index === -1) {
      throw new Error(`Webhook not found: ${id}`);
    }

    webhooks.splice(index, 1);
    this.writeWebhooks(webhooks);
  }

  async get(id: string): Promise<WebhookSubscription | undefined> {
    const webhooks = this.readWebhooks();
    return webhooks.find((w) => w.id === id);
  }

  async trigger(event: string, payload?: Record<string, any>): Promise<WebhookEvent> {
    const webhooks = this.readWebhooks();
    const subscription = webhooks.find((w) => w.event === event && w.active);

    if (!subscription) {
      throw new Error(`No active webhook subscription for event: ${event}`);
    }

    const webhookEvent: WebhookEvent = {
      event,
      timestamp: new Date().toISOString(),
      payload: payload || {},
      subscriptionId: subscription.id,
      deliveryId: `delivery-${Date.now()}`,
    };

    const body = JSON.stringify(webhookEvent);
    const url = new URL(subscription.url);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body).toString(),
      'X-Webhook-Event': event,
      'X-Webhook-Delivery': webhookEvent.deliveryId,
      ...(subscription.headers || {}),
    };

    if (subscription.secret) {
      const sig = crypto.createHmac('sha256', subscription.secret).update(body).digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${sig}`;
    }

    const maxAttempts = subscription.retryCount + 1;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const req = lib.request(
            {
              hostname: url.hostname,
              port: url.port || (isHttps ? 443 : 80),
              path: url.pathname + url.search,
              method: 'POST',
              headers,
              timeout: subscription.timeout || 30000,
            },
            (res) => {
              let data = '';
              res.on('data', (chunk) => {
                data += chunk;
              });
              res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                  resolve();
                } else {
                  reject(
                    new Error(
                      `Webhook ${subscription.url} returned ${res.statusCode}: ${data.slice(0, 200)}`
                    )
                  );
                }
              });
            }
          );
          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Webhook ${subscription.url} timed out`));
          });
          req.write(body);
          req.end();
        });

        subscription.lastTriggered = new Date().toISOString();
        subscription.triggerCount++;
        subscription.updatedAt = new Date().toISOString();
        subscription.failCount = Math.max(0, subscription.failCount - 1);
        this.writeWebhooks(webhooks);
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    if (lastError) {
      subscription.failCount++;
      subscription.updatedAt = new Date().toISOString();
      this.writeWebhooks(webhooks);
      throw new Error(
        `Webhook delivery failed after ${maxAttempts} attempts: ${lastError.message}`
      );
    }

    return webhookEvent;
  }

  async enable(id: string): Promise<WebhookSubscription> {
    const webhooks = this.readWebhooks();
    const webhook = webhooks.find((w) => w.id === id);

    if (!webhook) {
      throw new Error(`Webhook not found: ${id}`);
    }

    webhook.active = true;
    webhook.updatedAt = new Date().toISOString();
    this.writeWebhooks(webhooks);
    return webhook;
  }

  async disable(id: string): Promise<WebhookSubscription> {
    const webhooks = this.readWebhooks();
    const webhook = webhooks.find((w) => w.id === id);

    if (!webhook) {
      throw new Error(`Webhook not found: ${id}`);
    }

    webhook.active = false;
    webhook.updatedAt = new Date().toISOString();
    this.writeWebhooks(webhooks);
    return webhook;
  }

  async update(
    id: string,
    updates: Partial<Omit<WebhookSubscription, 'id'>>
  ): Promise<WebhookSubscription> {
    const webhooks = this.readWebhooks();
    const webhook = webhooks.find((w) => w.id === id);

    if (!webhook) {
      throw new Error(`Webhook not found: ${id}`);
    }

    Object.assign(webhook, updates, { updatedAt: new Date().toISOString() });
    this.writeWebhooks(webhooks);
    return webhook;
  }

  private getDefaultWebhooks(): WebhookSubscription[] {
    return [
      {
        id: 'wh-001',
        event: 'agent.completed',
        url: 'https://hooks.example.com/on-complete',
        secret: 'super-secret',
        active: true,
        description: 'Trigger when an agent completes a task',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
        triggerCount: 0,
        failCount: 0,
        retryCount: 3,
        timeout: 30000,
      },
      {
        id: 'wh-002',
        event: 'agent.error',
        url: 'https://hooks.example.com/on-error',
        active: true,
        description: 'Trigger when an agent encounters an error',
        createdAt: '2026-05-02T00:00:00.000Z',
        updatedAt: '2026-05-02T00:00:00.000Z',
        triggerCount: 0,
        failCount: 0,
        retryCount: 3,
        timeout: 30000,
      },
      {
        id: 'wh-003',
        event: 'session.started',
        url: 'https://hooks.example.com/on-start',
        active: false,
        description: 'Trigger when a new session starts',
        createdAt: '2026-05-03T00:00:00.000Z',
        updatedAt: '2026-05-03T00:00:00.000Z',
        triggerCount: 0,
        failCount: 0,
        retryCount: 3,
        timeout: 30000,
      },
    ];
  }
}
