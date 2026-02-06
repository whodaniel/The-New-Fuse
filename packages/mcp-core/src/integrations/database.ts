/**
 * Database Integration for MCP Core
 *
 * This module provides integration with The New Fuse database systems,
 * enabling persistent storage of MCP service information, metrics, and state.
 */

// Optional database integration
let db: any = null;
let databaseModule: any = null;

try {
  databaseModule = require('@the-new-fuse/database');
  if (databaseModule && databaseModule.db) {
    db = databaseModule.db; // Use Drizzle client
  }
} catch (error) {
  console.log('Database integration not available, using in-memory storage');
}

export interface DatabaseIntegrationConfig {
  enabled: boolean;
  autoMigrate: boolean;
  enableMetrics: boolean;
  enableAuditLog: boolean;
  cacheTTL: number;
  batchSize: number;
}

export interface MCPServiceRecord {
  id: string;
  name: string;
  version: string;
  endpoint: string;
  capabilities: string[];
  resources: any;
  tools: any;
  status: string;
  metadata: any;
  healthScore: number;
  tags: string[];
  registeredAt: Date;
  lastHeartbeat: Date;
  lastActivity: Date;
  metrics?: MCPServiceMetrics;
}

export interface MCPServiceMetrics {
  serviceId: string;
  timestamp: Date;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  connections: number;
  throughput: number;
}

export interface MCPAuditLog {
  id: string;
  serviceId: string;
  action: string;
  details: any;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Database Integration Bridge
 * Provides persistent storage capabilities for MCP services
 */
export const DatabaseIntegration = {
  isAvailable: !!db,

  /**
   * Initialize database connection and schema
   */
  async initialize(config?: Partial<DatabaseIntegrationConfig>): Promise<boolean> {
    if (!db) {
      return false;
    }

    try {
      // Test connection
      await db.$connect();

      if (config?.autoMigrate) {
        // Run migrations if available
        if (databaseModule && databaseModule.runMigrations) {
          await databaseModule.runMigrations();
        }
      }

      console.log('Database integration initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize database integration:', error);
      return false;
    }
  },

  /**
   * Save MCP service information to database
   */
  async saveServiceInfo(serviceInfo: any): Promise<MCPServiceRecord | null> {
    if (!db) {
      return serviceInfo; // Return as-is if no database
    }

    try {
      const record: Omit<MCPServiceRecord, 'metrics'> = {
        id: serviceInfo.id,
        name: serviceInfo.name,
        version: serviceInfo.version,
        endpoint: serviceInfo.endpoint,
        capabilities: serviceInfo.capabilities || [],
        resources: serviceInfo.resources || [],
        tools: serviceInfo.tools || [],
        status: serviceInfo.status || 'ONLINE',
        metadata: serviceInfo.metadata || {},
        healthScore: serviceInfo.healthScore || 1.0,
        tags: serviceInfo.tags || [],
        registeredAt: serviceInfo.registeredAt || new Date(),
        lastHeartbeat: serviceInfo.lastHeartbeat || new Date(),
        lastActivity: new Date(),
      };

      // Use upsert to handle both create and update
      const result = await this.executeWithRetry(
        () =>
          db.mcpService?.upsert({
            where: { id: serviceInfo.id },
            create: record,
            update: {
              ...record,
              lastActivity: new Date(),
            },
          }) || Promise.resolve(record)
      );

      return result as MCPServiceRecord | null;
    } catch (error) {
      console.error('Failed to save service info to database:', error);
      return null;
    }
  },

  /**
   * Get MCP service information from database
   */
  async getServiceInfo(serviceId: string): Promise<MCPServiceRecord | null> {
    if (!db) {
      return null;
    }

    try {
      const result = await this.executeWithRetry(
        () =>
          db.mcpService?.findUnique({
            where: { id: serviceId },
            include: {
              metrics: {
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          }) || Promise.resolve(null)
      );

      return result as MCPServiceRecord | null;
    } catch (error) {
      console.error('Failed to get service info from database:', error);
      return null;
    }
  },

  /**
   * Get all MCP services from database
   */
  async getAllServices(filters?: {
    status?: string;
    capabilities?: string[];
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<MCPServiceRecord[]> {
    if (!db) {
      return [];
    }

    try {
      const where: any = {};

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.capabilities?.length) {
        where.capabilities = {
          hasEvery: filters.capabilities,
        };
      }

      if (filters?.tags?.length) {
        where.tags = {
          hasSome: filters.tags,
        };
      }

      const result = await this.executeWithRetry(
        () =>
          db.mcpService?.findMany({
            where,
            take: filters?.limit,
            skip: filters?.offset,
            orderBy: { lastActivity: 'desc' },
            include: {
              metrics: {
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          }) || Promise.resolve([])
      );

      return result as MCPServiceRecord[];
    } catch (error) {
      console.error('Failed to get services from database:', error);
      return [];
    }
  },

  /**
   * Delete MCP service from database
   */
  async deleteService(serviceId: string): Promise<boolean> {
    if (!db) {
      return true; // No-op if no database
    }

    try {
      await this.executeWithRetry(
        () =>
          db.mcpService?.delete({
            where: { id: serviceId },
          }) || Promise.resolve()
      );

      return true;
    } catch (error) {
      console.error('Failed to delete service from database:', error);
      return false;
    }
  },

  /**
   * Save service metrics to database
   */
  async saveMetrics(metrics: Omit<MCPServiceMetrics, 'timestamp'>): Promise<boolean> {
    if (!db) {
      return false;
    }

    try {
      await this.executeWithRetry(
        () =>
          db.mcpServiceMetrics?.create({
            data: {
              ...metrics,
              timestamp: new Date(),
            },
          }) || Promise.resolve()
      );

      return true;
    } catch (error) {
      console.error('Failed to save metrics to database:', error);
      return false;
    }
  },

  /**
   * Get service metrics from database
   */
  async getMetrics(
    serviceId: string,
    options?: {
      from?: Date;
      to?: Date;
      limit?: number;
      aggregation?: 'raw' | 'hourly' | 'daily';
    }
  ): Promise<MCPServiceMetrics[]> {
    if (!db) {
      return [];
    }

    try {
      const where: any = { serviceId };

      if (options?.from || options?.to) {
        where.timestamp = {};
        if (options.from) where.timestamp.gte = options.from;
        if (options.to) where.timestamp.lte = options.to;
      }

      const result = await this.executeWithRetry(
        () =>
          db.mcpServiceMetrics?.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: options?.limit || 100,
          }) || Promise.resolve([])
      );

      return result as MCPServiceMetrics[];
    } catch (error) {
      console.error('Failed to get metrics from database:', error);
      return [];
    }
  },

  /**
   * Log audit event
   */
  async logAudit(auditLog: Omit<MCPAuditLog, 'id' | 'timestamp'>): Promise<boolean> {
    if (!db) {
      return false;
    }

    try {
      await this.executeWithRetry(
        () =>
          db.mcpAuditLog?.create({
            data: {
              id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...auditLog,
              timestamp: new Date(),
            },
          }) || Promise.resolve()
      );

      return true;
    } catch (error) {
      console.error('Failed to log audit event to database:', error);
      return false;
    }
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(
    serviceId?: string,
    options?: {
      action?: string;
      from?: Date;
      to?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<MCPAuditLog[]> {
    if (!db) {
      return [];
    }

    try {
      const where: any = {};

      if (serviceId) {
        where.serviceId = serviceId;
      }

      if (options?.action) {
        where.action = options.action;
      }

      if (options?.from || options?.to) {
        where.timestamp = {};
        if (options.from) where.timestamp.gte = options.from;
        if (options.to) where.timestamp.lte = options.to;
      }

      const result = await this.executeWithRetry(
        () =>
          db.mcpAuditLog?.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: options?.limit || 100,
            skip: options?.offset,
          }) || Promise.resolve([])
      );

      return result as MCPAuditLog[];
    } catch (error) {
      console.error('Failed to get audit logs from database:', error);
      return [];
    }
  },

  /**
   * Clean up old records
   */
  async cleanup(options?: {
    metricsRetentionDays?: number;
    auditRetentionDays?: number;
    inactiveServiceDays?: number;
  }): Promise<{
    deletedMetrics: number;
    deletedAudits: number;
    deletedServices: number;
  }> {
    if (!db) {
      return { deletedMetrics: 0, deletedAudits: 0, deletedServices: 0 };
    }

    const result = { deletedMetrics: 0, deletedAudits: 0, deletedServices: 0 };

    try {
      const now = new Date();

      // Clean up old metrics
      if (options?.metricsRetentionDays) {
        const metricsThreshold = new Date(
          now.getTime() - options.metricsRetentionDays * 24 * 60 * 60 * 1000
        );
        const deletedMetrics = await this.executeWithRetry(
          () =>
            db.mcpServiceMetrics?.deleteMany({
              where: {
                timestamp: { lt: metricsThreshold },
              },
            }) || Promise.resolve({ count: 0 })
        );
        result.deletedMetrics = (deletedMetrics as any)?.count || 0;
      }

      // Clean up old audit logs
      if (options?.auditRetentionDays) {
        const auditThreshold = new Date(
          now.getTime() - options.auditRetentionDays * 24 * 60 * 60 * 1000
        );
        const deletedAudits = await this.executeWithRetry(
          () =>
            db.mcpAuditLog?.deleteMany({
              where: {
                timestamp: { lt: auditThreshold },
              },
            }) || Promise.resolve({ count: 0 })
        );
        result.deletedAudits = (deletedAudits as any)?.count || 0;
      }

      // Clean up inactive services
      if (options?.inactiveServiceDays) {
        const serviceThreshold = new Date(
          now.getTime() - options.inactiveServiceDays * 24 * 60 * 60 * 1000
        );
        const deletedServices = await this.executeWithRetry(
          () =>
            db.mcpService?.deleteMany({
              where: {
                lastActivity: { lt: serviceThreshold },
                status: 'OFFLINE',
              },
            }) || Promise.resolve({ count: 0 })
        );
        result.deletedServices = (deletedServices as any)?.count || 0;
      }

      return result;
    } catch (error) {
      console.error('Failed to cleanup database records:', error);
      return result;
    }
  },

  /**
   * Execute database operation with retry logic
   */
  async executeWithRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  },

  /**
   * Get database health and statistics
   */
  async getHealthStats(): Promise<{
    connected: boolean;
    services: number;
    metrics: number;
    audits: number;
    lastActivity: Date | null;
  }> {
    if (!db) {
      return {
        connected: false,
        services: 0,
        metrics: 0,
        audits: 0,
        lastActivity: null,
      };
    }

    try {
      const [servicesCount, metricsCount, auditsCount, lastService] = await Promise.all([
        db.mcpService?.count() || Promise.resolve(0),
        db.mcpServiceMetrics?.count() || Promise.resolve(0),
        db.mcpAuditLog?.count() || Promise.resolve(0),
        db.mcpService?.findFirst({
          orderBy: { lastActivity: 'desc' },
          select: { lastActivity: true },
        }) || Promise.resolve(null),
      ]);

      return {
        connected: true,
        services: servicesCount,
        metrics: metricsCount,
        audits: auditsCount,
        lastActivity: lastService?.lastActivity || null,
      };
    } catch (error) {
      console.error('Failed to get database health stats:', error);
      return {
        connected: false,
        services: 0,
        metrics: 0,
        audits: 0,
        lastActivity: null,
      };
    }
  },

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (db && db.$disconnect) {
      await db.$disconnect();
    }
  },
};

/**
 * Default database integration configuration
 */
export const DEFAULT_DATABASE_CONFIG: DatabaseIntegrationConfig = {
  enabled: true,
  autoMigrate: false,
  enableMetrics: true,
  enableAuditLog: true,
  cacheTTL: 300, // 5 minutes
  batchSize: 100,
};

/**
 * Database Integration Factory
 */
export class DatabaseIntegrationFactory {
  static async create(config?: Partial<DatabaseIntegrationConfig>) {
    const finalConfig = { ...DEFAULT_DATABASE_CONFIG, ...config };

    const initialized = await DatabaseIntegration.initialize(finalConfig);

    return {
      config: finalConfig,
      integration: DatabaseIntegration,
      isInitialized: initialized,

      async getService(serviceId: string) {
        return await DatabaseIntegration.getServiceInfo(serviceId);
      },

      async saveService(serviceInfo: any) {
        const result = await DatabaseIntegration.saveServiceInfo(serviceInfo);

        if (finalConfig.enableAuditLog && result) {
          await DatabaseIntegration.logAudit({
            serviceId: serviceInfo.id,
            action: 'SERVICE_SAVED',
            details: { name: serviceInfo.name, version: serviceInfo.version },
          });
        }

        return result;
      },

      async recordMetrics(
        serviceId: string,
        metrics: Omit<MCPServiceMetrics, 'serviceId' | 'timestamp'>
      ) {
        if (!finalConfig.enableMetrics) {
          return false;
        }

        return await DatabaseIntegration.saveMetrics({
          serviceId,
          ...metrics,
        });
      },

      async performCleanup() {
        return await DatabaseIntegration.cleanup({
          metricsRetentionDays: 30,
          auditRetentionDays: 90,
          inactiveServiceDays: 7,
        });
      },
    };
  }
}

export default DatabaseIntegration;
