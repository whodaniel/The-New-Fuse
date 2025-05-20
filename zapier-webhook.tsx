import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Database } from './database.js';

export interface WebhookDefinition {
  id: string;
  userId: string;
  name: string;
  description?: string;
  url: string;
  headers?: Record<string, string>;
  service?: 'zapier' | 'integromat' | 'n8n' | 'custom';
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  isEnabled: boolean;
}

export class ZapierWebhook {
  private db: Database;
  
  constructor(database: Database) {
    this.db = database;
  }
  
  async createWebhook(
    userId: string, 
    name: string, 
    url: string, 
    description?: string, 
    headers?: Record<string, string>, 
    service: 'zapier' | 'integromat' | 'n8n' | 'custom' = 'zapier',
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST',
    metadata?: Record<string, any>
  ): Promise<WebhookDefinition> {
    const webhook: WebhookDefinition = {
      id: uuidv4(),
      userId,
      name,
      description,
      url,
      headers,
      service,
      method,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata,
      isEnabled: true
    };
    
    await this.db.collection('webhooks').insertOne(webhook);
    return webhook;
  }
  
  async getWebhooks(userId: string): Promise<WebhookDefinition[]> {
    return await this.db.collection('webhooks').find({ userId }).toArray();
  }
  
  async getWebhook(id: string): Promise<WebhookDefinition | null> {
    return await this.db.collection('webhooks').findOne({ id });
  }
  
  async updateWebhook(id: string, updates: Partial<WebhookDefinition>): Promise<WebhookDefinition | null> {
    const webhook = await this.getWebhook(id);
    if (!webhook) return null;
    
    const updatedWebhook = {
      ...webhook,
      ...updates,
      updatedAt: new Date()
    };
    
    await this.db.collection('webhooks').updateOne({ id }, { $set: updatedWebhook });
    return updatedWebhook;
  }
  
  async deleteWebhook(id: string): Promise<boolean> {
    const result = await this.db.collection('webhooks').deleteOne({ id });
    return result.deletedCount === 1;
  }
  
  async triggerWebhook(id: string, payload: any): Promise<boolean> {
    const webhook = await this.getWebhook(id);
    if (!webhook || !webhook.isEnabled) return false;
    
    try {
      if (webhook.method === 'GET') {
        // Convert payload to query parameters for GET requests
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(payload)) {
          if (typeof value === 'string') {
            queryParams.append(key, value);
          } else {
            queryParams.append(key, JSON.stringify(value));
          }
        }
        
        const urlWithParams = webhook.url + (webhook.url.includes('?') ? '&' : '?') + queryParams.toString();
        await axios.get(urlWithParams, { headers: webhook.headers });
      } else {
        await axios.request({
          method: webhook.method || 'POST',
          url: webhook.url,
          headers: webhook.headers,
          data: payload
        });
      }
      return true;
    } catch (error) {
      console.error(`Failed to trigger webhook ${id}:`, error);
      return false;
    }
  }
  
  async toggleWebhook(id: string, enabled: boolean): Promise<WebhookDefinition | null> {
    return this.updateWebhook(id, { isEnabled: enabled });
  }
  
  async getWebhooksByService(userId: string, service: 'zapier' | 'integromat' | 'n8n' | 'custom'): Promise<WebhookDefinition[]> {
    return await this.db.collection('webhooks').find({ userId, service }).toArray();
  }
}
