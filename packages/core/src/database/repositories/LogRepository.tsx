import { EntityRepository, LessThan } from 'typeorm';
import { BaseRepository } from './BaseRepository.js';
import { Log } from '../entities/Log.js';

@EntityRepository(Log)
export class LogRepository extends BaseRepository<Log> {
    async createLog(
        level: 'debug' | 'info' | 'warn' | 'error',
        message: string,
        metadata?: Record<string, any>
    ): Promise<Log> {
        const log = new Log();
        log.level = level;
        log.message = message;
        log.metadata = metadata;
        return this.save(log);
    }

    async findLogs(
        options?: {
            level?: Log['level'];
            startTime?: Date;
            endTime?: Date;
            limit?: number;
        }
    ): Promise<Log[]> {
        const query = this.createQueryBuilder('log');

        if (options?.level) {
            query.andWhere('log.level = :level', { level: options.level });
        }

        if (options?.startTime && options?.endTime) {
            query.andWhere('log.timestamp BETWEEN :startTime AND :endTime', {
                startTime: options.startTime,
                endTime: options.endTime,
            });
        }

        if (options?.limit) {
            query.take(options.limit);
        }

        return query.getMany();
    }

    async getLogStatistics(
        startTime?: Date,
        endTime?: Date
    ): Promise<Record<Log['level'], number>> {
        const query = this.createQueryBuilder('log')
            .select('log.level', 'level')
            .addSelect('COUNT(*)', 'count')
            .groupBy('log.level');

        if (startTime && endTime) {
            query.where('log.timestamp BETWEEN :startTime AND :endTime', {
                startTime,
                endTime,
            });
        }

        const results = await query.getRawMany();
        return results.reduce((acc, curr) => {
            acc[curr.level] = parseInt(curr.count, 10);
            return acc;
        }, {} as Record<Log['level'], number>);
    }

    async deleteOldLogs(retentionDays: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const result = await this.delete({
            timestamp: LessThan(cutoffDate),
        });

        return result.affected || 0;
    }
}
