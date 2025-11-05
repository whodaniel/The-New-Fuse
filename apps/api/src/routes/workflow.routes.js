/**
 * Workflow Routes - Production ready REST API routes
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { workflowValidationSchemas } from '../validation/workflow.schemas';
export function createWorkflowRoutes(workflowController) {
    const router = Router();
    // Apply authentication middleware to all routes
    router.use(authMiddleware);
    // Workflow CRUD routes
    router.get('/', workflowController.getWorkflows.bind(workflowController));
    router.get('/:id', workflowController.getWorkflow.bind(workflowController));
    router.post('/', validateRequest(workflowValidationSchemas.create), workflowController.createWorkflow.bind(workflowController));
    router.patch('/:id', validateRequest(workflowValidationSchemas.update), workflowController.updateWorkflow.bind(workflowController));
    router.delete('/:id', workflowController.deleteWorkflow.bind(workflowController));
    // Workflow execution routes
    router.post('/execute', validateRequest(workflowValidationSchemas.execute), workflowController.executeWorkflow.bind(workflowController));
    router.get('/executions/:executionId', workflowController.getExecution.bind(workflowController));
    router.get('/executions', workflowController.getExecutions.bind(workflowController));
    router.get('/:workflowId/executions', workflowController.getExecutions.bind(workflowController));
    // Execution control routes
    router.post('/executions/:executionId/cancel', workflowController.cancelExecution.bind(workflowController));
    router.post('/executions/:executionId/pause', workflowController.pauseExecution.bind(workflowController));
    router.post('/executions/:executionId/resume', workflowController.resumeExecution.bind(workflowController));
    // Workflow validation
    router.post('/validate', validateRequest(workflowValidationSchemas.validate), workflowController.validateWorkflow.bind(workflowController));
    // Template routes
    router.get('/templates', workflowController.getTemplates.bind(workflowController));
    router.get('/templates/:id', workflowController.getTemplate.bind(workflowController));
    router.post('/from-template', validateRequest(workflowValidationSchemas.fromTemplate), workflowController.createFromTemplate.bind(workflowController));
    return router;
}
//# sourceMappingURL=workflow.routes.js.map