/**
 * Database Integration for MCP Core
 *
 * This module provides integration with The New Fuse database systems,
 * enabling persistent storage of MCP service information, metrics, and state.
 */
// Optional database integration
let prisma = null;
let databaseModule = null;
try {
    databaseModule = require('@the-new-fuse/database');
    if (databaseModule && databaseModule.PrismaService) {
        prisma = new databaseModule.PrismaService();
    }
}
catch (error) {
    // Try direct Prisma client
    try {
        const { PrismaClient } = require('@prisma/client');
        prisma = new PrismaClient();
    }
    catch (prismaError) {
        console.log('Database integration not available, using in-memory storage');
    }
}
/**
 * Database Integration Bridge
 * Provides persistent storage capabilities for MCP services
 */
export const DatabaseIntegration = {
    isAvailable: !!prisma,
    /**
     * Initialize database connection and schema
     */
    async initialize(config) {
        if (!prisma) {
            return false;
        }
        try {
            // Test connection
            await prisma.$connect();
            if (config?.autoMigrate) {
                // Run migrations if available
                if (databaseModule && databaseModule.runMigrations) {
                    await databaseModule.runMigrations();
                }
            }
            console.log('Database integration initialized successfully');
            return true;
        }
        catch (error) {
            console.error('Failed to initialize database integration:', error);
            return false;
        }
    },
    /**
     * Save MCP service information to database
     */
    async saveServiceInfo(serviceInfo) {
        if (!prisma) {
            return serviceInfo; // Return as-is if no database
        }
        try {
            const record = {
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
                lastActivity: new Date()
            };
            // Use upsert to handle both create and update
            const result = await this.executeWithRetry(() => prisma.mcpService?.upsert({
                where: { id: serviceInfo.id },
                create: record,
                update: {
                    ...record,
                    lastActivity: new Date()
                }
            }) || Promise.resolve(record));
            return result;
        }
        catch (error) {
            console.error('Failed to save service info to database:', error);
            return null;
        }
    },
    /**
     * Get MCP service information from database
     */
    async getServiceInfo(serviceId) {
        if (!prisma) {
            return null;
        }
        try {
            const result = await this.executeWithRetry(() => prisma.mcpService?.findUnique({
                where: { id: serviceId },
                include: {
                    metrics: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    }
                }
            }) || Promise.resolve(null));
            return result;
        }
        catch (error) {
            console.error('Failed to get service info from database:', error);
            return null;
        }
    },
    /**
     * Get all MCP services from database
     */
    async getAllServices(filters) {
        if (!prisma) {
            return [];
        }
        try {
            const where = {};
            if (filters?.status) {
                where.status = filters.status;
            }
            if (filters?.capabilities?.length) {
                where.capabilities = {
                    hasEvery: filters.capabilities
                };
            }
            if (filters?.tags?.length) {
                where.tags = {
                    hasSome: filters.tags
                };
            }
            const result = await this.executeWithRetry(() => prisma.mcpService?.findMany({
                where,
                take: filters?.limit,
                skip: filters?.offset,
                orderBy: { lastActivity: 'desc' },
                include: {
                    metrics: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    }
                }
            }) || Promise.resolve([]));
            return result;
        }
        catch (error) {
            console.error('Failed to get services from database:', error);
            return [];
        }
    },
    /**
     * Delete MCP service from database
     */
    async deleteService(serviceId) {
        if (!prisma) {
            return true; // No-op if no database
        }
        try {
            await this.executeWithRetry(() => prisma.mcpService?.delete({
                where: { id: serviceId }
            }) || Promise.resolve());
            return true;
        }
        catch (error) {
            console.error('Failed to delete service from database:', error);
            return false;
        }
    },
    /**
     * Save service metrics to database
     */
    async saveMetrics(metrics) {
        if (!prisma) {
            return false;
        }
        try {
            await this.executeWithRetry(() => prisma.mcpServiceMetrics?.create({
                data: {
                    ...metrics,
                    timestamp: new Date()
                }
            }) || Promise.resolve());
            return true;
        }
        catch (error) {
            console.error('Failed to save metrics to database:', error);
            return false;
        }
    },
    /**
     * Get service metrics from database
     */
    async getMetrics(serviceId, options) {
        if (!prisma) {
            return [];
        }
        try {
            const where = { serviceId };
            if (options?.from || options?.to) {
                where.timestamp = {};
                if (options.from)
                    where.timestamp.gte = options.from;
                if (options.to)
                    where.timestamp.lte = options.to;
            }
            const result = await this.executeWithRetry(() => prisma.mcpServiceMetrics?.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: options?.limit || 100
            }) || Promise.resolve([]));
            return result;
        }
        catch (error) {
            console.error('Failed to get metrics from database:', error);
            return [];
        }
    },
    /**
     * Log audit event
     */
    async logAudit(auditLog) {
        if (!prisma) {
            return false;
        }
        try {
            await this.executeWithRetry(() => prisma.mcpAuditLog?.create({
                data: {
                    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...auditLog,
                    timestamp: new Date()
                }
            }) || Promise.resolve());
            return true;
        }
        catch (error) {
            console.error('Failed to log audit event to database:', error);
            return false;
        }
    },
    /**
     * Get audit logs
     */
    async getAuditLogs(serviceId, options) {
        if (!prisma) {
            return [];
        }
        try {
            const where = {};
            if (serviceId) {
                where.serviceId = serviceId;
            }
            if (options?.action) {
                where.action = options.action;
            }
            if (options?.from || options?.to) {
                where.timestamp = {};
                if (options.from)
                    where.timestamp.gte = options.from;
                if (options.to)
                    where.timestamp.lte = options.to;
            }
            const result = await this.executeWithRetry(() => prisma.mcpAuditLog?.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: options?.limit || 100,
                skip: options?.offset
            }) || Promise.resolve([]));
            return result;
        }
        catch (error) {
            console.error('Failed to get audit logs from database:', error);
            return [];
        }
    },
    /**
     * Clean up old records
     */
    async cleanup(options) {
        if (!prisma) {
            return { deletedMetrics: 0, deletedAudits: 0, deletedServices: 0 };
        }
        const result = { deletedMetrics: 0, deletedAudits: 0, deletedServices: 0 };
        try {
            const now = new Date();
            // Clean up old metrics
            if (options?.metricsRetentionDays) {
                const metricsThreshold = new Date(now.getTime() - options.metricsRetentionDays * 24 * 60 * 60 * 1000);
                const deletedMetrics = await this.executeWithRetry(() => prisma.mcpServiceMetrics?.deleteMany({
                    where: {
                        timestamp: { lt: metricsThreshold }
                    }
                }) || Promise.resolve({ count: 0 }));
                result.deletedMetrics = deletedMetrics?.count || 0;
            }
            // Clean up old audit logs
            if (options?.auditRetentionDays) {
                const auditThreshold = new Date(now.getTime() - options.auditRetentionDays * 24 * 60 * 60 * 1000);
                const deletedAudits = await this.executeWithRetry(() => prisma.mcpAuditLog?.deleteMany({
                    where: {
                        timestamp: { lt: auditThreshold }
                    }
                }) || Promise.resolve({ count: 0 }));
                result.deletedAudits = deletedAudits?.count || 0;
            }
            // Clean up inactive services
            if (options?.inactiveServiceDays) {
                const serviceThreshold = new Date(now.getTime() - options.inactiveServiceDays * 24 * 60 * 60 * 1000);
                const deletedServices = await this.executeWithRetry(() => prisma.mcpService?.deleteMany({
                    where: {
                        lastActivity: { lt: serviceThreshold },
                        status: 'OFFLINE'
                    }
                }) || Promise.resolve({ count: 0 }));
                result.deletedServices = deletedServices?.count || 0;
            }
            return result;
        }
        catch (error) {
            console.error('Failed to cleanup database records:', error);
            return result;
        }
    },
    /**
     * Execute database operation with retry logic
     */
    async executeWithRetry(operation, maxRetries = 3) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries) {
                    break;
                }
                // Wait before retry (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    },
    /**
     * Get database health and statistics
     */
    async getHealthStats() {
        if (!prisma) {
            return {
                connected: false,
                services: 0,
                metrics: 0,
                audits: 0,
                lastActivity: null
            };
        }
        try {
            const [servicesCount, metricsCount, auditsCount, lastService] = await Promise.all([
                prisma.mcpService?.count() || Promise.resolve(0),
                prisma.mcpServiceMetrics?.count() || Promise.resolve(0),
                prisma.mcpAuditLog?.count() || Promise.resolve(0),
                prisma.mcpService?.findFirst({
                    orderBy: { lastActivity: 'desc' },
                    select: { lastActivity: true }
                }) || Promise.resolve(null)
            ]);
            return {
                connected: true,
                services: servicesCount,
                metrics: metricsCount,
                audits: auditsCount,
                lastActivity: lastService?.lastActivity || null
            };
        }
        catch (error) {
            console.error('Failed to get database health stats:', error);
            return {
                connected: false,
                services: 0,
                metrics: 0,
                audits: 0,
                lastActivity: null
            };
        }
    },
    /**
     * Disconnect from database
     */
    async disconnect() {
        if (prisma && prisma.$disconnect) {
            await prisma.$disconnect();
        }
    }
};
/**
 * Default database integration configuration
 */
export const DEFAULT_DATABASE_CONFIG = {
    enabled: true,
    autoMigrate: false,
    enableMetrics: true,
    enableAuditLog: true,
    cacheTTL: 300, // 5 minutes
    batchSize: 100
};
/**
 * Database Integration Factory
 */
export class DatabaseIntegrationFactory {
    static async create(config) {
        const finalConfig = { ...DEFAULT_DATABASE_CONFIG, ...config };
        const initialized = await DatabaseIntegration.initialize(finalConfig);
        return {
            config: finalConfig,
            integration: DatabaseIntegration,
            isInitialized: initialized,
            async getService(serviceId) {
                return await DatabaseIntegration.getServiceInfo(serviceId);
            },
            async saveService(serviceInfo) {
                const result = await DatabaseIntegration.saveServiceInfo(serviceInfo);
                if (finalConfig.enableAuditLog && result) {
                    await DatabaseIntegration.logAudit({
                        serviceId: serviceInfo.id,
                        action: 'SERVICE_SAVED',
                        details: { name: serviceInfo.name, version: serviceInfo.version }
                    });
                }
                return result;
            },
            async recordMetrics(serviceId, metrics) {
                if (!finalConfig.enableMetrics) {
                    return false;
                }
                return await DatabaseIntegration.saveMetrics({
                    serviceId,
                    ...metrics
                });
            },
            async performCleanup() {
                return await DatabaseIntegration.cleanup({
                    metricsRetentionDays: 30,
                    auditRetentionDays: 90,
                    inactiveServiceDays: 7
                });
            }
        };
    }
}
export default DatabaseIntegration;
//# sourceMappingURL=database.js.map