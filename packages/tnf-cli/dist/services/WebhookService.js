import * as crypto from 'crypto';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';
export class WebhookService {
    constructor() {
        this.webhooksPath = path.join(os.homedir(), '.tnf', 'webhooks.json');
    }
    readWebhooks() {
        if (!fs.existsSync(this.webhooksPath)) {
            return this.getDefaultWebhooks();
        }
        try {
            const data = fs.readFileSync(this.webhooksPath, 'utf8');
            return JSON.parse(data);
        }
        catch {
            return this.getDefaultWebhooks();
        }
    }
    writeWebhooks(webhooks) {
        fs.writeFileSync(this.webhooksPath, JSON.stringify(webhooks, null, 2));
    }
    async list() {
        return this.readWebhooks();
    }
    async add(event, url, options = {}) {
        const webhooks = this.readWebhooks();
        const id = `wh-${Date.now().toString(36)}`;
        const subscription = {
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
    async remove(id) {
        const webhooks = this.readWebhooks();
        const index = webhooks.findIndex((w) => w.id === id);
        if (index === -1) {
            throw new Error(`Webhook not found: ${id}`);
        }
        webhooks.splice(index, 1);
        this.writeWebhooks(webhooks);
    }
    async get(id) {
        const webhooks = this.readWebhooks();
        return webhooks.find((w) => w.id === id);
    }
    async trigger(event, payload) {
        const webhooks = this.readWebhooks();
        const subscription = webhooks.find((w) => w.event === event && w.active);
        if (!subscription) {
            throw new Error(`No active webhook subscription for event: ${event}`);
        }
        const webhookEvent = {
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
        const headers = {
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
        let lastError = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await new Promise((resolve, reject) => {
                    const req = lib.request({
                        hostname: url.hostname,
                        port: url.port || (isHttps ? 443 : 80),
                        path: url.pathname + url.search,
                        method: 'POST',
                        headers,
                        timeout: subscription.timeout || 30000,
                    }, (res) => {
                        let data = '';
                        res.on('data', (chunk) => {
                            data += chunk;
                        });
                        res.on('end', () => {
                            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                                resolve();
                            }
                            else {
                                reject(new Error(`Webhook ${subscription.url} returned ${res.statusCode}: ${data.slice(0, 200)}`));
                            }
                        });
                    });
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
            }
            catch (err) {
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
            throw new Error(`Webhook delivery failed after ${maxAttempts} attempts: ${lastError.message}`);
        }
        return webhookEvent;
    }
    async enable(id) {
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
    async disable(id) {
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
    async update(id, updates) {
        const webhooks = this.readWebhooks();
        const webhook = webhooks.find((w) => w.id === id);
        if (!webhook) {
            throw new Error(`Webhook not found: ${id}`);
        }
        Object.assign(webhook, updates, { updatedAt: new Date().toISOString() });
        this.writeWebhooks(webhooks);
        return webhook;
    }
    getDefaultWebhooks() {
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
//# sourceMappingURL=WebhookService.js.map