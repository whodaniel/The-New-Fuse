import { Database } from './database.js';
import { User } from './types.js';

interface ApiUsageRecord {
  userId: string;
  endpoint: string;
  timestamp: Date;
  tokens?: number;
  cost?: number;
  success: boolean;
  nodeId?: string;
  workflowId?: string;
  serviceProvider?: string;
}

export class ApiUsageTracker {
  private db: Database;
  
  constructor(database: Database) {
    this.db = database;
  }
  
  async trackUsage(record: ApiUsageRecord): Promise<void> {
    await this.db.collection('apiUsage').insertOne(record);
  }
  
  async getUserUsage(userId: string, startDate?: Date, endDate?: Date): Promise<ApiUsageRecord[]> {
    const query: any = { userId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    return await this.db.collection('apiUsage').find(query).toArray();
  }
  
  async getUserBilling(userId: string, month: number, year: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const records = await this.getUserUsage(userId, startDate, endDate);
    return records.reduce((total, record) => total + (record.cost || 0), 0);
  }
  
  async checkRateLimit(userId: string, endpoint: string): Promise<boolean> {
    const user = await this.db.collection('users').findOne({ id: userId }) as User;
    const plan = user.plan || 'free';
    
    // Get usage in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentUsage = await this.db.collection('apiUsage').count({
      userId,
      endpoint,
      timestamp: { $gte: oneHourAgo }
    });
    
    // Define rate limits based on plan
    const rateLimits: Record<string, number> = {
      'free': 60,
      'basic': 300,
      'premium': 1000,
      'enterprise': 5000
    };
    
    return recentUsage < (rateLimits[plan] || rateLimits.free);
  }
  
  // New methods for workflow integration
  async getNodeUsage(nodeId: string, startDate?: Date, endDate?: Date): Promise<ApiUsageRecord[]> {
    const query: any = { nodeId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    return await this.db.collection('apiUsage').find(query).toArray();
  }
  
  async getWorkflowUsage(workflowId: string, startDate?: Date, endDate?: Date): Promise<ApiUsageRecord[]> {
    const query: any = { workflowId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    return await this.db.collection('apiUsage').find(query).toArray();
  }
  
  async getServiceProviderUsage(serviceProvider: string, userId?: string, startDate?: Date, endDate?: Date): Promise<ApiUsageRecord[]> {
    const query: any = { serviceProvider };
    
    if (userId) query.userId = userId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    return await this.db.collection('apiUsage').find(query).toArray();
  }
}
