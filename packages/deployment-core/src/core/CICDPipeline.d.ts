import { ICICDPipeline } from '../interfaces/ICICDPipeline';
import { BuildTrigger, BuildResult } from '../types/pipeline';
import { PipelineExecutor } from './PipelineExecutor';
import { PipelineValidator } from './PipelineValidator';
import { PipelineStorage } from './PipelineStorage';
import { NotificationService } from './NotificationService';
import { MetricsCollector } from './MetricsCollector';
import { Logger } from 'winston';
import { EventEmitter } from 'events';
/**
 * Core CI/CD Pipeline implementation
 * Manages the complete lifecycle of CI/CD pipelines including build, test, and deployment
 */
export declare class CICDPipeline extends EventEmitter implements ICICDPipeline {
    private executor;
    private validator;
    private storage;
    private notificationService;
    private metricsCollector;
    private logger;
    private runningPipelines;
    constructor(executor: PipelineExecutor, validator: PipelineValidator, storage: PipelineStorage, notificationService: NotificationService, metricsCollector: MetricsCollector, logger: Logger);
    /**
     * Trigger a build based on the provided trigger configuration
     */
    triggerBuild(trigger: BuildTrigger): Promise<BuildResult>;
}
//# sourceMappingURL=CICDPipeline.d.ts.map