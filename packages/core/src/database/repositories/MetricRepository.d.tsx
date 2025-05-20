import { BaseRepository } from './BaseRepository.js';
import { Metric } from '../entities/Metric.js';
export declare class MetricRepository extends BaseRepository<Metric> {
    createPerformanceMetric(): Promise<void>;
}
