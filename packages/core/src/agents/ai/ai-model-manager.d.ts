import { LoggingService } from '../../services/LoggingService';
import { MetricsService } from '../../monitoring/MetricsService';
export interface AIModel {
    id: string;
    name: string;
    description: string;
    type: 'language_model' | 'vision_model' | 'embedding_model' | 'classification' | 'regression' | 'clustering' | 'recommendation';
    provider: 'openai' | 'anthropic' | 'google' | 'huggingface' | 'local' | 'custom';
    model_identifier: string;
    version: string;
    configuration: {
        max_tokens?: number;
        temperature?: number;
        top_p?: number;
        frequency_penalty?: number;
        presence_penalty?: number;
        stop_sequences?: string[];
        system_prompt?: string;
        custom_parameters?: Record<string, any>;
    };
    capabilities: string[];
    status: 'available' | 'loading' | 'error' | 'maintenance' | 'deprecated';
    performance_metrics: {
        average_latency_ms: number;
        success_rate: number;
        tokens_per_second?: number;
        accuracy_score?: number;
        cost_per_request?: number;
    };
    usage_limits: {
        max_requests_per_minute: number;
        max_requests_per_day: number;
        max_tokens_per_request: number;
    };
    created_at: Date;
    updated_at: Date;
    last_used_at?: Date;
    metadata: Record<string, any>;
}
export interface ModelRequest {
    id: string;
    model_id: string;
    user_id: string;
    request_type: 'completion' | 'chat' | 'embedding' | 'classification' | 'analysis' | 'generation';
    input_data: any;
    configuration_override?: Partial<AIModel['configuration']>;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    created_at: Date;
    started_at?: Date;
    completed_at?: Date;
    response_data?: any;
    error_message?: string;
    token_usage?: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
    };
    cost?: number;
    latency_ms?: number;
}
export interface ModelTemplate {
    id: string;
    name: string;
    description: string;
    model_type: AIModel['type'];
    provider: AIModel['provider'];
    base_configuration: AIModel['configuration'];
    prompt_template?: string;
    input_schema: Record<string, any>;
    output_schema: Record<string, any>;
    use_cases: string[];
    tags: string[];
    is_public: boolean;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface ModelEvaluation {
    id: string;
    model_id: string;
    evaluation_type: 'performance' | 'accuracy' | 'bias' | 'safety' | 'cost_analysis';
    test_dataset_id?: string;
    metrics: Record<string, number>;
    results: {
        summary: string;
        detailed_scores: Record<string, any>;
        benchmarks: Record<string, number>;
        recommendations: string[];
    };
    evaluation_config: Record<string, any>;
    evaluated_at: Date;
    evaluated_by: string;
}
export interface ModelUsageAnalytics {
    model_id: string;
    time_period: 'hour' | 'day' | 'week' | 'month';
    start_date: Date;
    end_date: Date;
    metrics: {
        total_requests: number;
        successful_requests: number;
        failed_requests: number;
        average_latency_ms: number;
        total_tokens_processed: number;
        total_cost: number;
        unique_users: number;
        peak_requests_per_minute: number;
    };
    usage_patterns: {
        hourly_distribution: Record<string, number>;
        request_type_distribution: Record<string, number>;
        user_segment_distribution: Record<string, number>;
    };
    generated_at: Date;
}
export interface ModelFineTuning {
    id: string;
    base_model_id: string;
    name: string;
    description: string;
    training_dataset_id: string;
    validation_dataset_id?: string;
    hyperparameters: {
        learning_rate: number;
        batch_size: number;
        epochs: number;
        warmup_steps?: number;
        weight_decay?: number;
    };
    status: 'preparing' | 'training' | 'validating' | 'completed' | 'failed' | 'cancelled';
    progress: {
        current_epoch: number;
        total_epochs: number;
        training_loss: number;
        validation_loss?: number;
        estimated_completion: Date;
    };
    result_model_id?: string;
    training_logs: string[];
    created_at: Date;
    started_at?: Date;
    completed_at?: Date;
    created_by: string;
}
export interface AIModelStatistics {
    total_models: number;
    active_models: number;
    total_requests_today: number;
    successful_requests_today: number;
    failed_requests_today: number;
    average_latency_ms: number;
    total_cost_today: number;
    tokens_processed_today: number;
    most_used_model: string;
    success_rate: number;
    models_by_provider: Record<string, number>;
    models_by_type: Record<string, number>;
    last_updated: Date;
}
export declare class AIModelManagerAgent {
    private readonly logger;
    private readonly metricsService;
    private models;
    private modelRequests;
    private modelTemplates;
    private modelEvaluations;
    private modelUsageAnalytics;
    private fineTuningJobs;
    private requestQueue;
    private isInitialized;
    private statistics;
    constructor(logger: LoggingService, metricsService: MetricsService);
    private initializeStatistics;
    private initializeDefaultModels;
}
//# sourceMappingURL=ai-model-manager.d.ts.map