import { PipelineDefinition, PipelineResult, BuildResult, DeploymentResult, RollbackResult } from '../types/pipeline.js';
import { Logger } from 'winston';
/**
 * Notification Service handles sending notifications for pipeline events
 */
export declare class NotificationService {
    private logger;
    constructor(logger: Logger);
    /**
     * Notify pipeline start
     */
    notifyPipelineStart(pipeline: PipelineDefinition, executionId: string): Promise<void>;
    /**
     * Notify pipeline completion
     */
    notifyPipelineComplete(result: PipelineResult): Promise<void>;
    /**
     * Notify pipeline failure
     */
    notifyPipelineFailed(result: PipelineResult): Promise<void>;
    /**
     * Notify build completion
     */
    notifyBuildComplete(result: BuildResult): Promise<void>;
    /**
     * Notify deployment completion
     */
    notifyDeploymentComplete(result: DeploymentResult): Promise<void>;
    /**
     * Notify deployment failure
     */
    notifyDeploymentFailed(result: DeploymentResult): Promise<void>;
    /**
     * Notify rollback completion
     */
    notifyRollbackComplete(result: RollbackResult): Promise<void>;
    private sendNotifications;
    private sendToChannel;
    private sendSlackNotification;
    private sendEmailNotification;
    private sendWebhookNotification;
    private sendSMSNotification;
    private formatSlackMessage;
    private getSlackColor;
    private getSlackEmoji;
    private getEmailSubject;
    private getSMSMessage;
    private evaluateNotificationConditions;
    private formatDuration;
    private getDefaultNotifications;
}
//# sourceMappingURL=NotificationService.d.ts.map