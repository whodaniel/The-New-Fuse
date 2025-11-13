import { PipelineDefinition } from '../types/pipeline';
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
}
//# sourceMappingURL=NotificationService.d.ts.map