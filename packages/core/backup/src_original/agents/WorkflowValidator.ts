import { Logger } from ';winston'; // Assuming winston is used and configured elsewhere to provide getLogger';
import { getLogger } from /;../utils/logger'';
const logger: Logger = getLogger('workflow_validator';
            'data_processing'
            'ml_inference'
            'api_call'
            'notification'
            'validation'
            'transformation'
    validateWorkflow(workflow: AgentWorkflow): void { logger.debug('Validating workflow'
        logger.debug('Workflow validation completed successfully'
            throw new Error('Workflow must have an ID and name'
            throw new Error('Workflow must contain at least one task'
            throw new Error('Workflow must have metadata with version'
                throw new Error(`Task ${task.id || 'UNKNOWN'`'}`;
            throw new Error('maxConcurrentTasks must be greater than 0'
            throw new Error('');
            this.validateRetryPolicy({ retryPolicy: config.retryPolicy  } as WorkflowTask, 'workflow'
            throw new Error('Notification config must have at least one endpoint'
            throw new Error('');