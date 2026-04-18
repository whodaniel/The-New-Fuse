import { Injectable } from '@nestjs/common';
import { Repository, DataSource, FindManyOptions, Between } from 'typeorm';
import { Log, LogLevel } from '../entities/Log';

@Injectable()
export class LogRepository extends Repository<Log> {
  constructor(private dataSource: DataSource) {
    super(Log, dataSource.createEntityManager());
  }

  async findByLevel(level: LogLevel, options?: FindManyOptions<Log>): Promise<Log[]> {
    return this.find({
      ...options,
      where: { level },
      order: { timestamp: 'DESC' },
    });
  }

  async findByTimeRange(startTime: Date, endTime: Date): Promise<Log[]> {
    return this.find({
      where: {
        timestamp: Between(startTime, endTime),
      },
      order: { timestamp: 'DESC' },
    });
  }

  async searchLogs(searchTerm: string, limit: number = 100): Promise<Log[]> {
    return this.createQueryBuilder('log')
      .where('log.message ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('log.timestamp', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getLogStatistics(since: Date): Promise<{ level: string; count: number }[]> {
    const result = await this.createQueryBuilder('log')
      .select('log.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .where('log.timestamp >= :since', { since })
      .groupBy('log.level')
      .getRawMany();

    return result;
  }

  async getTopContexts(since: Date, limit: number = 10): Promise<{ context: string; count: number }[]> {
    const topContextsResult = await this.createQueryBuilder('log')
      .select('log.context', 'context')
      .addSelect('COUNT(*)', 'count')
      .where('log.timestamp >= :since', { since })
      .andWhere('log.context IS NOT NULL')
      .groupBy('log.context')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    return topContextsResult;
  }

  async deleteOldLogs(beforeDate: Date): Promise<number> {
    const result = await this.delete({
      timestamp: Between(new Date(0), beforeDate) as any,
    });

    return result.affected ?? 0;
  }
}
