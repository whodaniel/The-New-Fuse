"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIModelManagerAgent = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../../services/LoggingService");
const MetricsService_1 = require("../../monitoring/MetricsService");
let AIModelManagerAgent = class AIModelManagerAgent {
    logger;
    metricsService;
    models = new Map();
    modelRequests = new Map();
    modelTemplates = new Map();
    modelEvaluations = new Map();
    modelUsageAnalytics = [];
    fineTuningJobs = new Map();
    requestQueue = [];
    isInitialized = false;
    statistics;
    constructor(logger, metricsService) {
        this.logger = logger;
        this.metricsService = metricsService;
        this.statistics = this.initializeStatistics();
        this.initializeDefaultModels();
    }
    initializeStatistics() {
        return {
            total_models: 0,
            active_models: 0,
            total_requests_today: 0,
            successful_requests_today: 0,
            failed_requests_today: 0,
            average_latency_ms: 0,
            total_cost_today: 0,
            tokens_processed_today: 0,
            most_used_model: '',
            success_rate: 0,
            models_by_provider: {},
            models_by_type: {},
            last_updated: new Date()
        };
    }
    initializeDefaultModels() {
        const defaultModels = [
            {
                name: 'GPT-4 Turbo',
                description: 'Advanced language model for complex reasoning and generation',
                type: 'language_model',
                provider: 'openai',
                model_identifier: 'gpt-4-turbo-preview',
                version: '2024-01-25',
                configuration: {
                    max_tokens: 4096,
                    temperature: 0.7,
                    top_p: 1.0,
                    frequency_penalty: 0,
                    presence_penalty: 0
                },
                capabilities: ['text_generation', 'code_generation', 'reasoning', 'analysis'],
                status: 'available',
                performance_metrics: {
                    average_latency_ms: 2500,
                    success_rate: 0.98,
                    tokens_per_second: 25,
                    cost_per_request: 0.01
                },
                usage_limits: {
                    max_requests_per_minute: 60,
                    max_requests_per_day: 10000,
                    max_tokens_per_request: 4096
                },
                metadata: {}
            },
            {
                name: 'Claude 3 Opus',
                description: 'Advanced reasoning and analysis model',
                type: 'language_model',
                provider: 'anthropic',
                model_identifier: 'claude-3-opus-20240229',
                version: '2024-02-29',
                configuration: {
                    max_tokens: 4096,
                    temperature: 0.7,
                    top_p: 1.0
                },
                capabilities: ['text_generation', 'analysis', 'reasoning', 'code_review'],
                status: 'available',
                performance_metrics: {
                    average_latency_ms: 3000,
                    success_rate: 0.97,
                    tokens_per_second: 20,
                    cost_per_request: 0.015
                },
                usage_limits: {
                    max_requests_per_minute: 50,
                    max_requests_per_day: 8000,
                    max_tokens_per_request: 4096
                },
                metadata: {}
            },
            {
                name: 'DALL-E 3',
                description: 'Advanced image generation model',
                type: 'vision_model',
                provider: 'openai',
                model_identifier: 'dall-e-3',
                version: '2023-10-01',
                configuration: {
                    custom_parameters: {
                        quality: 'standard',
                        size: '1024x1024',
                        style: 'vivid',
                        capabilities: ['image_generation', 'style_transfer'],
                        status: 'available',
                        performance_metrics: {
                            average_latency_ms: 15000,
                            success_rate: 0.95,
                            cost_per_request: 0.04
                        },
                        usage_limits: {
                            max_requests_per_minute: 10,
                            max_requests_per_day: 1000,
                            max_tokens_per_request: 4000
                        },
                        metadata: {}
                    }
                }
            }
        ];
        defaultModels.forEach(modelData => {
            const model = {
                id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
        ...modelData,
        created_at: new Date(),
        updated_at: new Date()
      };
      this.models.set(model.id, model);
      this.statistics.total_models++;
      if (model.status === 'available') {
        this.statistics.active_models++;
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.log('Initializing AI Model Manager Agent...', 'AIModelManagerAgent');
      
      // Start processing intervals
      this.startRequestProcessor();
      this.startStatisticsUpdate();
      this.startModelHealthCheck();
      this.startUsageAnalytics();
      
      this.isInitialized = true;
      this.logger.log('AI Model Manager Agent initialized successfully', 'AIModelManagerAgent');
      
      await this.metricsService.recordMetric('ai_model_manager_initialized', 1, 'counter', { labels: { component: 'ai_model_manager');
    } catch (error) {
      this.logger.error('Failed to initialize AI Model Manager Agent', error instanceof Error ? error : new Error(String(error)), 'AIModelManagerAgent');
      throw error;
    }
  }

  async registerModel(
    name: string,
    description: string,
    type: AIModel['type'],
    provider: AIModel['provider'],
    modelIdentifier: string,
    version: string,
    configuration: AIModel['configuration'],
    capabilities: string[],
    usageLimits: AIModel['usage_limits']
  ): Promise<AIModel> {
    const model: AIModel = {`,
                id: model_$
            }, { Date, now };
            ();
        }, `_${Math.random().toString(36).substr(2, 9)}`, name, description, type, provider, model_identifier, modelIdentifier, version, configuration, capabilities, status, 'loading', performance_metrics, {
            average_latency_ms: 0,
            success_rate: 0,
            cost_per_request: 0
        }, usage_limits, usageLimits, created_at, new Date(), updated_at, new Date(), metadata, {});
    }
    ;
};
exports.AIModelManagerAgent = AIModelManagerAgent;
exports.AIModelManagerAgent = AIModelManagerAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        MetricsService_1.MetricsService])
], AIModelManagerAgent);
this.models.set(model.id, model);
this.statistics.total_models++;
// Simulate model loading and validation
setTimeout(async () => {
    model.status = 'available';
    this.statistics.active_models++;
    this.models.set(model.id, model);
    await this.metricsService.recordMetric('ai_model_registered', 1, 'counter', {
        labels: {
            provider: provider,
            type: type
        }
    });
}, 2000);
return model;
async;
submitRequest(modelId, string, userId, string, requestType, ModelRequest['request_type'], inputData, any, priority, ModelRequest['priority'] = 'normal', configOverride ?  : Partial);
Promise < ModelRequest > {
    try: {
        const: model = this.models.get(modelId),
        if(, model) {
            throw new Error(Model, $, { modelId }, not, found);
        },
        if(model) { }, : .status !== 'available'
    }
};
{
    `
        throw new Error(Model ${modelId}`;
    is;
    not;
    available(status, $, { model, : .status });
    ;
}
`
`;
const request = {
    id: request_$
}, { Date, now };
();
`_${Math.random().toString(36).substr(2, 9)},
        model_id: modelId,
        user_id: userId,
        request_type: requestType,
        input_data: inputData,
        configuration_override: configOverride,
        status: 'queued',
        priority,
        created_at: new Date()
      };

      this.modelRequests.set(request.id, request);
      
      // Add to queue with priority ordering
      this.addToQueue(request);
      
      this.statistics.total_requests_today++;

      await this.metricsService.recordMetric('ai_model_request_submitted', 1, 'counter', { 
        labels: { 
          model_id: modelId,
          request_type: requestType,
          priority: priority
        } 
      });

      return request;
    } catch (error) {
      this.logger.error('Failed to submit model request', error instanceof Error ? error : new Error(String(error)), 'AIModelManagerAgent');
      throw error;
    }
  }

  async getRequestStatus(requestId: string): Promise<ModelRequest | null> {
    return this.modelRequests.get(requestId) || null;
  }

  async cancelRequest(requestId: string): Promise<boolean> {
    try {
      const request = this.modelRequests.get(requestId);
      if (!request) {
        return false;
      }

      if (request.status === 'processing') {
        // Cannot cancel processing requests
        return false;
      }

      if (request.status === 'queued') {
        request.status = 'cancelled';
        request.completed_at = new Date();
        
        // Remove from queue
        const queueIndex = this.requestQueue.findIndex(r => r.id === requestId);
        if (queueIndex !== -1) {
          this.requestQueue.splice(queueIndex, 1);
        }

        this.modelRequests.set(requestId, request);

        await this.metricsService.recordMetric('ai_model_request_cancelled', 1, 'counter', { 
          labels: { 
            model_id: request.model_id 
          } 
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to cancel request', error instanceof Error ? error : new Error(String(error)), 'AIModelManagerAgent');
      return false;
    }
  }

  async createModelTemplate(
    name: string,
    description: string,
    modelType: ModelTemplate['model_type'],
    provider: ModelTemplate['provider'],
    baseConfiguration: ModelTemplate['base_configuration'],
    promptTemplate: string,
    inputSchema: Record<string, any>,
    outputSchema: Record<string, any>,
    useCases: string[],
    tags: string[],
    isPublic: boolean,
    createdBy: string`;
Promise < ModelTemplate > {} `
    const template: ModelTemplate = {
      id: template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    model_type;
modelType,
    provider,
    base_configuration;
baseConfiguration,
    prompt_template;
promptTemplate,
    input_schema;
inputSchema,
    output_schema;
outputSchema,
    use_cases;
useCases,
    tags,
    is_public;
isPublic,
    created_by;
createdBy,
    created_at;
new Date(),
    updated_at;
new Date();
;
this.modelTemplates.set(template.id, template);
await this.metricsService.recordMetric('ai_model_template_created', 1, 'counter', {
    labels: {
        type: modelType,
        provider: provider
    }
});
return template;
async;
evaluateModel(modelId, string, evaluationType, ModelEvaluation['evaluation_type'], testDatasetId, string, evaluationConfig, (Record), evaluatedBy, string);
Promise < ModelEvaluation > {
    try: {
        const: model = this.models.get(modelId),
        if(, model) {
            throw new Error(Model, $, { modelId }, not, found);
        }
    } `
      // Simulate model evaluation`,
    const: evaluation, ModelEvaluation = {
        id: eval_$
    }
};
{
    Date.now();
}
`_${Math.random().toString(36).substr(2, 9)},
        model_id: modelId,
        evaluation_type: evaluationType,
        test_dataset_id: testDatasetId,
        metrics: this.generateEvaluationMetrics(evaluationType),
        results: this.generateEvaluationResults(evaluationType),
        evaluation_config: evaluationConfig,
        evaluated_at: new Date(),
        evaluated_by: evaluatedBy
      };

      const existingEvaluations = this.modelEvaluations.get(modelId) || [];
      existingEvaluations.push(evaluation);
      this.modelEvaluations.set(modelId, existingEvaluations);

      await this.metricsService.recordMetric('ai_model_evaluation_completed', 1, 'counter', { 
        labels: { 
          model_id: modelId,
          evaluation_type: evaluationType
        } 
      });

      return evaluation;
    } catch (error) {
      this.logger.error('Failed to evaluate model', error instanceof Error ? error : new Error(String(error)), 'AIModelManagerAgent');
      throw error;
    }
  }

  async startFineTuning(
    baseModelId: string,
    name: string,
    description: string,
    trainingDatasetId: string,
    hyperparameters: ModelFineTuning['hyperparameters'],
    createdBy: string,
    validationDatasetId?: string
  ): Promise<ModelFineTuning> {
    try {`;
const baseModel = this.models.get(baseModelId);
`
      if (!baseModel) {
        throw new Error(Base model ${baseModelId}`;
not;
found;
;
const fineTuning = {
    id: finetune_$
}, { Date, now };
();
_$;
{
    Math.random().toString(36).substr(2, 9);
}
`,
        base_model_id: baseModelId,
        name,
        description,
        training_dataset_id: trainingDatasetId,
        validation_dataset_id: validationDatasetId,
        hyperparameters,
        status: 'preparing',
        progress: {
          current_epoch: 0,
          total_epochs: hyperparameters.epochs,
          training_loss: 0,
          estimated_completion: new Date(Date.now() + hyperparameters.epochs * 60 * 60 * 1000) // Rough estimate
        },
        training_logs: [],
        created_at: new Date(),
        created_by: createdBy
      };

      this.fineTuningJobs.set(fineTuning.id, fineTuning);

      // Simulate fine-tuning process
      this.simulateFineTuning(fineTuning.id);

      await this.metricsService.recordMetric('ai_model_finetuning_started', 1, 'counter', { 
        labels: { 
          base_model_id: baseModelId
        } 
      });

      return fineTuning;
    } catch (error) {
      this.logger.error('Failed to start fine-tuning', error instanceof Error ? error : new Error(String(error)), 'AIModelManagerAgent');
      throw error;
    }
  }

  async getModelUsageAnalytics(
    modelId: string,
    timePeriod: ModelUsageAnalytics['time_period'],
    startDate: Date,
    endDate: Date
  ): Promise<ModelUsageAnalytics> {
    const requests = Array.from(this.modelRequests.values()).filter(req => 
      req.model_id === modelId && 
      req.created_at >= startDate && 
      req.created_at <= endDate
    );

    const successfulRequests = requests.filter(req => req.status === 'completed');
    const failedRequests = requests.filter(req => req.status === 'failed');

    const analytics: ModelUsageAnalytics = {
      model_id: modelId,
      time_period: timePeriod,
      start_date: startDate,
      end_date: endDate,
      metrics: {
        total_requests: requests.length,
        successful_requests: successfulRequests.length,
        failed_requests: failedRequests.length,
        average_latency_ms: successfulRequests.length > 0 ? 
          successfulRequests.reduce((sum, req) => sum + (req.latency_ms || 0), 0) / successfulRequests.length : 0,
        total_tokens_processed: successfulRequests.reduce((sum, req) => 
          sum + (req.token_usage?.total_tokens || 0), 0),
        total_cost: successfulRequests.reduce((sum, req) => sum + (req.cost || 0), 0),
        unique_users: new Set(requests.map(req => req.user_id)).size,
        peak_requests_per_minute: this.calculatePeakRequestsPerMinute(requests)
      },
      usage_patterns: {
        hourly_distribution: this.calculateHourlyDistribution(requests),
        request_type_distribution: this.calculateRequestTypeDistribution(requests),
        user_segment_distribution: this.calculateUserSegmentDistribution(requests)
      },
      generated_at: new Date()
    };

    this.modelUsageAnalytics.push(analytics);

    return analytics;
  }

  async getStatistics(): Promise<AIModelStatistics> {
    this.updateStatistics();
    return { ...this.statistics };
  }

  async getHealthStatus(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: Record<string, any> }> {
    try {
      const activeModels = Array.from(this.models.values()).filter(m => m.status === 'available').length;
      const successRate = this.statistics.success_rate;
      const avgLatency = this.statistics.average_latency_ms;

      const status = successRate < 0.9 || avgLatency > 10000 ? 'unhealthy' : 
                    successRate < 0.95 || avgLatency > 5000 || activeModels < 3 ? 'degraded' : 'healthy';

      return {
        status,
        details: {
          active_models: activeModels,
          success_rate: successRate,
          average_latency_ms: avgLatency,
          requests_today: this.statistics.total_requests_today,
          queue_length: this.requestQueue.length,
          cost_today: this.statistics.total_cost_today,
          initialized: this.isInitialized
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  private addToQueue(request: ModelRequest): void {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    
    let insertIndex = this.requestQueue.length;
    for (let i = 0; i < this.requestQueue.length; i++) {
      if (priorityOrder[request.priority] < priorityOrder[this.requestQueue[i].priority]) {
        insertIndex = i;
        break;
      }
    }
    
    this.requestQueue.splice(insertIndex, 0, request);
  }

  private async processRequest(request: ModelRequest): Promise<void> {
    try {
      request.status = 'processing';
      request.started_at = new Date();

      const model = this.models.get(request.model_id);
      if (!model) {
        throw new Error(Model ${request.model_id} not found);
      }

      // Simulate API call to model
      const startTime = Date.now();
      const response = await this.callModelAPI(model, request);
      const endTime = Date.now();

      request.status = 'completed';
      request.completed_at = new Date();
      request.response_data = response;
      request.latency_ms = endTime - startTime;
      request.token_usage = this.calculateTokenUsage(request.input_data, response);
      request.cost = this.calculateCost(model, request.token_usage);

      this.statistics.successful_requests_today++;
      this.statistics.total_cost_today += request.cost || 0;
      this.statistics.tokens_processed_today += request.token_usage?.total_tokens || 0;

      // Update model performance metrics
      model.performance_metrics.average_latency_ms = 
        (model.performance_metrics.average_latency_ms * 0.9) + (request.latency_ms * 0.1);
      model.last_used_at = new Date();

      await this.metricsService.recordMetric('ai_model_request_completed', 1, 'counter', { 
        labels: { 
          model_id: request.model_id,
          request_type: request.request_type,
          latency_bucket: this.getLatencyBucket(request.latency_ms)
        } 
      });

    } catch (error) {
      request.status = 'failed';
      request.completed_at = new Date();
      request.error_message = error instanceof Error ? error.message : String(error);

      this.statistics.failed_requests_today++;
`;
this.logger.error(Request, $, { request, : .id } ` failed, error instanceof Error ? error : new Error(String(error)), 'AIModelManagerAgent');
    }

    this.modelRequests.set(request.id, request);
  }

  private async callModelAPI(model: AIModel, request: ModelRequest): Promise<any> {
    // Mock API call - in a real implementation this would call actual model APIs
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000)); // 1-4 seconds

    switch (request.request_type) {
      case 'completion':
      case 'chat':
        return {
          content: 'This is a mock response from the AI model.',
          finish_reason: 'stop'
        };
      case 'embedding':
        return {
          embedding: Array.from({ length: 1536 }, () => Math.random())
        };
      case 'classification':
        return {
          class: 'positive',
          confidence: 0.85,
          probabilities: { positive: 0.85, negative: 0.15 }
        };
      default:
        return { result: 'Mock response' };
    }
  }

  private calculateTokenUsage(inputData: any, responseData: any): ModelRequest['token_usage'] {
    // Mock token calculation
    const inputTokens = JSON.stringify(inputData).length / 4; // Rough estimate
    const outputTokens = JSON.stringify(responseData).length / 4;
    
    return {
      input_tokens: Math.ceil(inputTokens),
      output_tokens: Math.ceil(outputTokens),
      total_tokens: Math.ceil(inputTokens + outputTokens)
    };
  }

  private calculateCost(model: AIModel, tokenUsage: ModelRequest['token_usage']): number {
    const baseCost = model.performance_metrics.cost_per_request || 0.01;
    const tokenMultiplier = (tokenUsage?.total_tokens || 0) / 1000;
    return baseCost * (1 + tokenMultiplier);
  }

  private getLatencyBucket(latencyMs: number): string {
    if (latencyMs < 1000) return 'fast';
    if (latencyMs < 3000) return 'medium';
    if (latencyMs < 5000) return 'slow';
    return 'very_slow';
  }

  private generateEvaluationMetrics(evaluationType: ModelEvaluation['evaluation_type']): Record<string, number> {
    switch (evaluationType) {
      case 'performance':
        return {
          latency_p50: Math.random() * 2000 + 1000,
          latency_p95: Math.random() * 5000 + 2000,
          throughput_rps: Math.random() * 100 + 50
        };
      case 'accuracy':
        return {
          accuracy: Math.random() * 0.2 + 0.8,
          precision: Math.random() * 0.2 + 0.8,
          recall: Math.random() * 0.2 + 0.8,
          f1_score: Math.random() * 0.2 + 0.8
        };
      default:
        return { score: Math.random() };
    }
  }

  private generateEvaluationResults(evaluationType: ModelEvaluation['evaluation_type']): ModelEvaluation['results'] {
    return {
      summary: ${evaluationType}`, evaluation, completed, successfully, detailed_scores, {}, benchmarks, { industry_average: 0.85 }, recommendations, [
    'Consider fine-tuning for improved performance',
    'Monitor performance metrics regularly',
    'Implement A/B testing for model updates'
]);
async;
simulateFineTuning(jobId, string);
Promise < void  > {
    const: job = this.fineTuningJobs.get(jobId),
    if(, job) { }, return: ,
    job, : .status = 'training',
    job, : .started_at = new Date(),
    // Simulate training progress
    const: epochDuration = 30000, // 30 seconds per epoch for demo
    for(let, epoch = 1, epoch) { }
} <= job.hyperparameters.epochs;
epoch++;
{
    await new Promise(resolve => setTimeout(resolve, epochDuration));
    job.progress.current_epoch = epoch;
    job.progress.training_loss = Math.random() * 0.1 + 0.05; // Decreasing loss
    job.training_logs.push(Epoch, $, { epoch }, Training, loss = $, { job, : .progress.training_loss.toFixed(4) });
    this.fineTuningJobs.set(jobId, job);
}
// Complete fine-tuning`
job.status = 'completed';
`
    job.completed_at = new Date();`;
job.result_model_id = model_finetuned_$;
{
    Date.now();
}
`;

    this.fineTuningJobs.set(jobId, job);
  }

  private calculatePeakRequestsPerMinute(requests: ModelRequest[]): number {
    const minuteBuckets: Record<string, number> = {};
    
    requests.forEach(req => {
      const minute = new Date(req.created_at).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      minuteBuckets[minute] = (minuteBuckets[minute] || 0) + 1;
    });

    return Math.max(...Object.values(minuteBuckets), 0);
  }

  private calculateHourlyDistribution(requests: ModelRequest[]): Record<string, number> {
    const hourBuckets: Record<string, number> = {};
    
    requests.forEach(req => {
      const hour = req.created_at.getHours().toString();
      hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
    });

    return hourBuckets;
  }

  private calculateRequestTypeDistribution(requests: ModelRequest[]): Record<string, number> {
    const typeBuckets: Record<string, number> = {};
    
    requests.forEach(req => {
      typeBuckets[req.request_type] = (typeBuckets[req.request_type] || 0) + 1;
    });

    return typeBuckets;
  }

  private calculateUserSegmentDistribution(requests: ModelRequest[]): Record<string, number> {
    // Mock user segmentation
    const segments: Record<string, number> = {
      enterprise: 0,
      professional: 0,
      individual: 0
    };
    
    requests.forEach(() => {
      const segment = ['enterprise', 'professional', 'individual'][Math.floor(Math.random() * 3)];
      segments[segment]++;
    });

    return segments;
  }

  private startRequestProcessor(): void {
    setInterval(async () => {
      if (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift();
        if (request) {
          await this.processRequest(request);
        }
      }
    }, 1000); // Check every second
  }

  private startModelHealthCheck(): void {
    setInterval(() => {
      for (const model of this.models.values()) {
        if (model.status === 'available') {
          // Mock health check - in a real implementation this would ping the actual model
          if (Math.random() < 0.99) { // 99% uptime
            model.performance_metrics.success_rate = 0.98;
          } else {
            model.status = 'error';
            this.statistics.active_models--;
          }
        }
      }
    }, 60000); // Every minute
  }

  private startUsageAnalytics(): void {
    setInterval(() => {
      // Generate daily usage analytics for all models
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      for (const model of this.models.values()) {
        this.getModelUsageAnalytics(model.id, 'day', yesterday, today);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private startStatisticsUpdate(): void {
    setInterval(() => {
      this.updateStatistics();
    }, 30000); // Every 30 seconds
  }

  private updateStatistics(): void {
    const todayRequests = Array.from(this.modelRequests.values()).filter(req => {
      const today = new Date();
      const requestDate = new Date(req.created_at);
      return requestDate.toDateString() === today.toDateString();
    });

    this.statistics.total_requests_today = todayRequests.length;
    this.statistics.successful_requests_today = todayRequests.filter(req => req.status === 'completed').length;
    this.statistics.failed_requests_today = todayRequests.filter(req => req.status === 'failed').length;

    if (this.statistics.total_requests_today > 0) {
      this.statistics.success_rate = this.statistics.successful_requests_today / this.statistics.total_requests_today;
    }

    const completedRequests = todayRequests.filter(req => req.status === 'completed' && req.latency_ms);
    if (completedRequests.length > 0) {
      this.statistics.average_latency_ms = 
        completedRequests.reduce((sum, req) => sum + (req.latency_ms || 0), 0) / completedRequests.length;
    }

    // Update model distribution statistics
    this.statistics.models_by_provider = {};
    this.statistics.models_by_type = {};
    
    for (const model of this.models.values()) {
      this.statistics.models_by_provider[model.provider] = 
        (this.statistics.models_by_provider[model.provider] || 0) + 1;
      this.statistics.models_by_type[model.type] = 
        (this.statistics.models_by_type[model.type] || 0) + 1;
    }

    this.statistics.last_updated = new Date();
  }
};
//# sourceMappingURL=ai-model-manager.js.map