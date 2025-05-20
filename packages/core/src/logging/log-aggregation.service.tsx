import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as readline from 'readline';
import { CentralizedLoggingService } from './centralized-logging.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const createReadStream = fs.createReadStream;

export interface LogAggregationConfig {
  enabled: boolean;
  scanInterval: number; // in milliseconds
  batchSize: number;
  directory: string;
  storeInDatabase: boolean;
  maxEntriesPerQuery: number;
}

export interface LogSearchOptions {
  level?: string;
  context?: string;
  correlationId?: string;
  startDate?: Date;
  endDate?: Date;
  message?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class LogAggregationService implements OnModuleInit {
  private config: LogAggregationConfig;
  private scanInterval: NodeJS.Timeout;
  private processedFiles: Set<string> = new Set();
  private readonly logger: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger = this.loggingService.createLogger('LogAggregationService');
  }

  async onModuleInit() {
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('logging.aggregation.enabled', true),
      scanInterval: this.parseInterval(this.configService.get<string>('logging.aggregation.scanInterval', '5m')),
      batchSize: this.configService.get<number>('logging.aggregation.batchSize', 1000),
      directory: this.configService.get<string>('logging.file.directory', 'logs'),
      storeInDatabase: this.configService.get<boolean>('logging.aggregation.storeInDatabase', true),
      maxEntriesPerQuery: this.configService.get<number>('logging.aggregation.maxEntriesPerQuery', 10000)
    };

    if (!this.config.enabled) {
      this.logger.info('Log aggregation is disabled');
      return;
    }

    // Start scan interval
    this.scanInterval = setInterval(() => this.scanAndAggregate(), this.config.scanInterval);
    
    // Run initial scan
    await this.scanAndAggregate();
    
    this.logger.info('Log aggregation service initialized', {
      metadata: {
        config: {
          scanInterval: this.formatInterval(this.config.scanInterval),
          batchSize: this.config.batchSize,
          directory: this.config.directory,
          storeInDatabase: this.config.storeInDatabase
        }
      }
    });
  }

  /**
   * Search logs with various filters
   */
  async searchLogs(options: LogSearchOptions = {}): Promise<any[]> {
    const {
      level,
      context,
      correlationId,
      startDate,
      endDate,
      message,
      limit = 100,
      offset = 0
    } = options;
    
    // Ensure we don't exceed the maximum query size
    const actualLimit = Math.min(limit, this.config.maxEntriesPerQuery);
    
    if (!this.config.storeInDatabase) {
      this.logger.warn('Log search requested but database storage is disabled');
      return [];
    }
    
    try {
      const whereClause: any = {};
      
      if (level) {
        whereClause.level = level;
      }
      
      if (context) {
        whereClause.context = context;
      }
      
      if (correlationId) {
        whereClause.correlationId = correlationId;
      }
      
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = startDate;
        if (endDate) whereClause.timestamp.lte = endDate;
      }
      
      if (message) {
        whereClause.message = { contains: message, mode: 'insensitive' };
      }
      
      const logs = await this.prisma.logEntry.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: actualLimit,
        skip: offset
      });
      
      return logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        context: log.context,
        correlationId: log.correlationId,
        metadata: log.metadata
      }));
    } catch (error) {
      this.logger.error('Failed to search logs', { error });
      return [];
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(startDate?: Date, endDate?: Date): Promise<any> {
    if (!this.config.storeInDatabase) {
      this.logger.warn('Log stats requested but database storage is disabled');
      return {
        totalLogs: 0,
        byLevel: {},
        byContext: {},
        timeDistribution: []
      };
    }
    
    try {
      const whereClause: any = {};
      
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = startDate;
        if (endDate) whereClause.timestamp.lte = endDate;
      }
      
      // Get total count
      const totalLogs = await this.prisma.logEntry.count({
        where: whereClause
      });
      
      // Get counts by level
      const levelCounts = await this.prisma.$queryRaw`
        SELECT level, COUNT(*) as count
        FROM "LogEntry"
        WHERE ${whereClause.timestamp ? `timestamp >= ${whereClause.timestamp.gte} AND timestamp <= ${whereClause.timestamp.lte}` : '1=1'}
        GROUP BY level
        ORDER BY count DESC
      `;
      
      // Get counts by context
      const contextCounts = await this.prisma.$queryRaw`
        SELECT context, COUNT(*) as count
        FROM "LogEntry"
        WHERE ${whereClause.timestamp ? `timestamp >= ${whereClause.timestamp.gte} AND timestamp <= ${whereClause.timestamp.lte}` : '1=1'}
        GROUP BY context
        ORDER BY count DESC
        LIMIT 10
      `;
      
      // Get time distribution (by hour)
      const timeDistribution = await this.prisma.$queryRaw`
        SELECT 
          date_trunc('hour', timestamp) as hour,
          COUNT(*) as count
        FROM "LogEntry"
        WHERE ${whereClause.timestamp ? `timestamp >= ${whereClause.timestamp.gte} AND timestamp <= ${whereClause.timestamp.lte}` : '1=1'}
        GROUP BY hour
        ORDER BY hour
      `;
      
      return {
        totalLogs,
        byLevel: levelCounts,
        byContext: contextCounts,
        timeDistribution
      };
    } catch (error) {
      this.logger.error('Failed to get log stats', { error });
      return {
        totalLogs: 0,
        byLevel: {},
        byContext: {},
        timeDistribution: []
      };
    }
  }

  /**
   * Manually trigger log scanning and aggregation
   */
  async scanAndAggregate(): Promise<void> {
    try {
      const logDir = path.resolve(process.cwd(), this.config.directory);
      
      // Check if directory exists
      if (!fs.existsSync(logDir)) {
        return;
      }
      
      const files = await readdir(logDir);
      
      // Process log files
      for (const file of files) {
        // Skip already processed files and non-log files
        if (
          this.processedFiles.has(file) ||
          !file.endsWith('.log')
        ) {
          continue;
        }
        
        const filePath = path.join(logDir, file);
        await this.processLogFile(filePath);
        
        // Mark as processed
        this.processedFiles.add(file);
      }
    } catch (error) {
      this.logger.error('Error during log aggregation', { error });
    }
  }

  /**
   * Private methods
   */

  private async processLogFile(filePath: string): Promise<void> {
    const fileStats = await stat(filePath);
    const fileName = path.basename(filePath);
    
    this.logger.info(`Processing log file: ${fileName}`, {
      metadata: {
        size: this.formatSize(fileStats.size),
        modified: fileStats.mtime
      }
    });
    
    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let batchCount = 0;
    let processedCount = 0;
    let batch: any[] = [];
    
    for await (const line of rl) {
      // Skip empty lines
      if (!line.trim()) {
        continue;
      }
      
      try {
        // Parse log entry
        const logEntry = JSON.parse(line);
        
        // Add to batch
        batch.push({
          timestamp: new Date(logEntry.timestamp),
          level: logEntry.level,
          message: logEntry.message,
          context: logEntry.context,
          correlationId: logEntry.correlationId,
          metadata: this.sanitizeMetadata(logEntry)
        });
        
        batchCount++;
        
        // Process batch if it reaches the batch size
        if (batchCount >= this.config.batchSize) {
          if (this.config.storeInDatabase) {
            await this.storeBatchInDatabase(batch);
          }
          
          // Emit event for each log entry
          batch.forEach(entry => {
            this.eventEmitter.emit('logging.entry', entry);
          });
          
          processedCount += batchCount;
          batchCount = 0;
          batch = [];
        }
      } catch (error) {
        this.logger.warn(`Failed to parse log line: ${line.substring(0, 100)}...`, { error });
      }
    }
    
    // Process remaining batch
    if (batch.length > 0) {
      if (this.config.storeInDatabase) {
        await this.storeBatchInDatabase(batch);
      }
      
      // Emit event for each log entry
      batch.forEach(entry => {
        this.eventEmitter.emit('logging.entry', entry);
      });
      
      processedCount += batchCount;
    }
    
    this.logger.info(`Processed ${processedCount} log entries from ${fileName}`);
  }

  private async storeBatchInDatabase(batch: any[]): Promise<void> {
    try {
      await this.prisma.logEntry.createMany({
        data: batch,
        skipDuplicates: true
      });
    } catch (error) {
      this.logger.error('Failed to store log batch in database', { error });
    }
  }

  private sanitizeMetadata(logEntry: any): any {
    // Extract metadata fields (everything except standard fields)
    const standardFields = ['timestamp', 'level', 'message', 'context', 'correlationId'];
    const metadata: Record<string, any> = {};
    
    for (const key in logEntry) {
      if (!standardFields.includes(key)) {
        metadata[key] = logEntry[key];
      }
    }
    
    return metadata;
  }

  private parseInterval(intervalStr: string): number {
    const units = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };
    
    const match = intervalStr.match(/^(\d+)([smhd])?$/i);
    if (!match) {
      return 5 * 60 * 1000; // Default to 5 minutes
    }
    
    const value = parseInt(match[1], 10);
    const unit = (match[2] || 'm').toLowerCase();
    
    return value * (units[unit as keyof typeof units] || units.m);
  }

  private formatInterval(ms: number): string {
    const seconds = ms / 1000;
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = seconds / 60;
    if (minutes < 60) {
      return `${minutes.toFixed(0)}m`;
    }
    
    const hours = minutes / 60;
    if (hours < 24) {
      return `${hours.toFixed(0)}h`;
    }
    
    const days = hours / 24;
    return `${days.toFixed(0)}d`;
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
