import { EntityRepository, LessThan } from 'typeorm';
import { BaseRepository } from './BaseRepository.js';
import { Metric } from '../entities/Metric.js';

@EntityRepository(Metric)
export class MetricRepository extends BaseRepository<Metric> {
    async createPerformanceMetric(data: {
        duration: number;
        operation: string;
        success: boolean;
        metadata?: Record<string, any>;
    }): Promise<Metric> {
        const metric = new Metric();
        metric.duration = data.duration;
        metric.operation = data.operation;
        metric.success = data.success;
        metric.metadata = data.metadata;
        return this.save(metric);
    }

    async findMetrics(
        startTime: Date,
        endTime: Date,
        type?: string
    ): Promise<Metric[]> {
        const query = this.createQueryBuilder('metric')
            .where('metric.timestamp BETWEEN :startTime AND :endTime', {
                startTime,
                endTime,
            });

        if (type) {
            query.andWhere('metric.type = :type', { type });
        }

        return query.getMany();
    }

    async aggregateMetrics(
        options: {
            startTime: Date;
            endTime: Date;
            type: string;
            aggregation: 'avg' | 'sum' | 'count';
            groupBy?: 'hour' | 'day' | 'month';
        }
    ): Promise<any[]> {
        const query = this.createQueryBuilder('metric')
            .where('metric.type = :type', { type: options.type })
            .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', {
                startTime: options.startTime,
                endTime: options.endTime,
            });

        const timeFormat = {
            hour: 'YYYY-MM-DD HH24',
            day: 'YYYY-MM-DD',
            month: 'YYYY-MM',
        }[options.groupBy || 'day'];

        query.select(`to_char(metric.timestamp, '${timeFormat}')`, 'timeGroup');

        switch (options.aggregation) {
            case 'avg':
                query.addSelect('AVG(metric.data->>\'duration\')', 'value');
                break;
            case 'sum':
                query.addSelect('SUM(metric.data->>\'duration\')', 'value');
                break;
            case 'count':
                query.addSelect('COUNT(*)', 'value');
                break;
        }

        if (options.groupBy) {
            query.groupBy('timeGroup');
        }

        return query.getRawMany();
    }

    async deleteOldMetrics(retentionDays: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const result = await this.delete({
            timestamp: LessThan(cutoffDate),
        });

        return result.affected || 0;
    }
}
