import { LoggingService } from '../../services/LoggingService';
import { MetricsService } from '../../monitoring/MetricsService';
export interface Dataset {
    id: string;
    name: string;
    description: string;
    source: string;
    schema: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'date' | 'object';
        nullable: boolean;
        description?: string;
    }>;
    row_count: number;
    column_count: number;
    size_bytes: number;
    created_at: Date;
    updated_at: Date;
    metadata: Record<string, any>;
}
export interface AnalysisRequest {
    id: string;
    name: string;
    dataset_id: string;
    analysis_type: 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive' | 'exploratory';
    parameters: Record<string, any>;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    requested_by: string;
    created_at: Date;
    started_at?: Date;
    completed_at?: Date;
    error_message?: string;
    progress_percentage: number;
}
export interface AnalysisResult {
    id: string;
    request_id: string;
    analysis_type: string;
    results: {
        summary: Record<string, any>;
        metrics: Record<string, number>;
        insights: string[];
        visualizations: VisualizationConfig[];
        recommendations: string[];
        confidence_score: number;
    };
    execution_time_ms: number;
    memory_usage_mb: number;
    generated_at: Date;
}
export interface VisualizationConfig {
    id: string;
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'heatmap' | 'boxplot' | 'correlation_matrix';
    title: string;
    data: any[];
    config: {
        x_axis?: string;
        y_axis?: string;
        color_by?: string;
        aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
        filters?: Record<string, any>;
    };
    metadata: Record<string, any>;
}
export interface Dashboard {
    id: string;
    name: string;
    description: string;
    widgets: DashboardWidget[];
    layout: {
        rows: number;
        columns: number;
        widget_positions: Record<string, {
            row: number;
            col: number;
            width: number;
            height: number;
        }>;
    };
    refresh_interval_ms: number;
    is_public: boolean;
    created_by: string;
    created_at: Date;
    updated_at: Date;
    last_viewed_at?: Date;
}
export interface DashboardWidget {
    id: string;
    type: 'chart' | 'metric' | 'table' | 'text' | 'iframe';
    title: string;
    configuration: Record<string, any>;
    data_source: {
        type: 'dataset' | 'analysis_result' | 'real_time' | 'api';
        source_id: string;
        query?: string;
        refresh_interval_ms?: number;
    };
    is_active: boolean;
}
export interface StatisticalAnalysis {
    dataset_id: string;
    column_statistics: Record<string, {
        type: string;
        count: number;
        null_count: number;
        unique_count: number;
        mean?: number;
        median?: number;
        mode?: any;
        std_dev?: number;
        min?: any;
        max?: any;
        quartiles?: number[];
        distribution?: Record<string, number>;
    }>;
    correlations: Record<string, Record<string, number>>;
    outliers: Record<string, any[]>;
    data_quality_score: number;
    recommendations: string[];
    generated_at: Date;
}
export interface PredictiveModel {
    id: string;
    name: string;
    description: string;
    model_type: 'linear_regression' | 'logistic_regression' | 'decision_tree' | 'random_forest' | 'neural_network' | 'time_series';
    dataset_id: string;
    target_variable: string;
    features: string[];
    training_config: {
        train_size: number;
        validation_size: number;
        test_size: number;
        hyperparameters: Record<string, any>;
    };
    performance_metrics: {
        accuracy?: number;
        precision?: number;
        recall?: number;
        f1_score?: number;
        mse?: number;
        rmse?: number;
        mae?: number;
        r_squared?: number;
    };
    status: 'training' | 'completed' | 'failed' | 'deployed';
    created_at: Date;
    trained_at?: Date;
    deployed_at?: Date;
}
export interface Prediction {
    id: string;
    model_id: string;
    input_data: Record<string, any>;
    prediction: any;
    confidence_score: number;
    probability_distribution?: Record<string, number>;
    created_at: Date;
    metadata: Record<string, any>;
}
export interface AnalyticsStatistics {
    total_datasets: number;
    total_analyses: number;
    completed_analyses: number;
    failed_analyses: number;
    running_analyses: number;
    total_dashboards: number;
    active_dashboards: number;
    total_models: number;
    deployed_models: number;
    total_predictions: number;
    average_analysis_time_ms: number;
    average_model_accuracy: number;
    data_volume_gb: number;
    last_updated: Date;
}
export declare class AnalyticsEngineAgent {
    private readonly logger;
    private readonly metricsService;
    private datasets;
    private analysisRequests;
    private analysisResults;
    private dashboards;
    private statisticalAnalyses;
    private predictiveModels;
    private predictions;
    private analysisQueue;
    private isInitialized;
    private statistics;
    constructor(logger: LoggingService, metricsService: MetricsService);
    private initializeStatistics;
    initialize(): Promise<void>;
    registerDataset(name: string, description: string, source: string, schema: Dataset['schema'], metadata?: Record<string, any>): Promise<Dataset>;
    catch(error: any): void;
}
//# sourceMappingURL=analytics-engine.d.ts.map