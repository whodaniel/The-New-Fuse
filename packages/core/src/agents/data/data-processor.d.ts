import { LoggingService } from '../../services/LoggingService';
import { MetricsService } from '../../monitoring/MetricsService';
export interface DataSource {
    id: string;
    name: string;
    type: 'database' | 'api' | 'file' | 'stream' | 'webhook' | 'queue';
    connection_config: Record<string, any>;
    schema?: Record<string, any>;
    is_active: boolean;
    last_connected: Date;
    data_format: 'json' | 'csv' | 'xml' | 'parquet' | 'avro' | 'binary';
    created_at: Date;
    updated_at: Date;
    metadata: Record<string, any>;
}
export interface DataPipeline {
    id: string;
    name: string;
    description: string;
    source_ids: string[];
    transformations: DataTransformation[];
    destinations: DataDestination[];
    schedule: {
        type: 'manual' | 'interval' | 'cron' | 'event';
        expression?: string;
        interval_ms?: number;
        event_trigger?: string;
    };
    status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
    last_run: Date;
    next_run?: Date;
    created_at: Date;
    updated_at: Date;
    configuration: Record<string, any>;
}
export interface DataTransformation {
    id: string;
    name: string;
    type: 'filter' | 'map' | 'aggregate' | 'join' | 'validate' | 'enrich' | 'clean' | 'custom';
    parameters: Record<string, any>;
    order: number;
    is_active: boolean;
    error_handling: 'skip' | 'stop' | 'retry' | 'log';
    retry_config?: {
        max_attempts: number;
        delay_ms: number;
        backoff_multiplier: number;
    };
}
export interface DataDestination {
    id: string;
    name: string;
    type: 'database' | 'file' | 'api' | 'queue' | 'stream' | 'webhook';
    connection_config: Record<string, any>;
    format: string;
    is_active: boolean;
    batch_size?: number;
    flush_interval_ms?: number;
}
export interface ProcessingJob {
    id: string;
    pipeline_id: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    started_at?: Date;
    completed_at?: Date;
    records_processed: number;
    records_failed: number;
    records_skipped: number;
    error_message?: string;
    execution_time_ms?: number;
    memory_usage_mb?: number;
    metadata: Record<string, any>;
}
export interface DataQualityRule {
    id: string;
    name: string;
    description: string;
    rule_type: 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'uniqueness' | 'timeliness';
    field_name: string;
    condition: string;
    parameters: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface DataQualityReport {
    id: string;
    pipeline_id: string;
    job_id: string;
    rules_evaluated: number;
    rules_passed: number;
    rules_failed: number;
    quality_score: number;
    issues: {
        rule_id: string;
        field_name: string;
        issue_type: string;
        severity: string;
        count: number;
        sample_values: any[];
    }[];
    generated_at: Date;
}
export interface DataProcessingStatistics {
    total_pipelines: number;
    active_pipelines: number;
    total_jobs: number;
    running_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    total_records_processed: number;
    average_processing_time_ms: number;
    average_quality_score: number;
    data_sources_count: number;
    error_rate: number;
    throughput_records_per_second: number;
    last_updated: Date;
}
export declare class DataProcessorAgent {
    private readonly logger;
    private readonly metricsService;
    private dataSources;
    private dataPipelines;
    private processingJobs;
    private qualityRules;
    private qualityReports;
    private jobQueue;
    private isInitialized;
    private statistics;
    constructor(logger: LoggingService, metricsService: MetricsService);
    private initializeStatistics;
    private initializeDefaultQualityRules;
    initialize(): Promise<void>;
    createDataSource(name: string, type: DataSource['type'], connectionConfig: Record<string, any>, dataFormat: DataSource['data_format'], schema?: Record<string, any>): Promise<DataSource>;
}
//# sourceMappingURL=data-processor.d.ts.map