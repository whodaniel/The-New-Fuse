import express, { Request, Response, NextFunction } from 'express';
import agentService from '../services/agent.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.util.js';
import { ApiError } from '../middleware/error.middleware.js';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { createAgentSchema, updateAgentSchema, agentIdSchema } from '../schemas/agent.schema.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Define User interface if not globally available (matching controller)
interface User {
  id: string;
  [key: string]: any;
}

// Extend Express Request type (matching controller)
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Get all agents - Add authentication and pass userId
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError('Authentication required', 401));
        }
        // Use getAgents(userId) instead of findAll()
        const agents = await agentService.getAgents(req.user.id);
        sendSuccess(res, agents);
    } catch (error) {
        // Use toError helper if available, otherwise keep existing error handling
        const err = error instanceof Error ? error : new Error('Failed to fetch agents');
        next(new ApiError(err.message || 'Failed to fetch agents', 500));
    }
});

// Get agent by ID - Add authentication and pass userId
router.get('/:id', authenticate, validateParams(agentIdSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
         if (!req.user) {
            return next(new ApiError('Authentication required', 401));
        }
        // Use getAgentById(id, userId) instead of findById(id)
        const agent = await agentService.getAgentById(req.params.id, req.user.id);
        // Service now throws if not found
        // if (!agent) {
        //     return next(new ApiError('Agent not found', 404));
        // }
        sendSuccess(res, agent);
    } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch agent');
        if (err.message?.includes('not found')) {
             return next(new ApiError('Agent not found', 404));
        }
        next(new ApiError(err.message || `Failed to fetch agent ${req.params.id}`, 500));
    }
});

// Create a new agent - Add authentication and pass userId
router.post('/', authenticate, validateBody(createAgentSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
         if (!req.user) {
            return next(new ApiError('Authentication required', 401));
        }
        // Pass userId to createAgent
        // Ensure req.body matches CreateAgentDto expected by the service
        const newAgent = await agentService.createAgent(req.body, req.user.id);
        sendCreated(res, newAgent);
    } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to create agent');
         if (err.message?.includes('already exists')) {
             return next(new ApiError(err.message, 409)); // Conflict
        }
        next(new ApiError(err.message || 'Failed to create agent', 500));
    }
});

// Update an agent - Add authentication and pass userId
router.put('/:id', authenticate, validateParams(agentIdSchema), validateBody(updateAgentSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
         if (!req.user) {
            return next(new ApiError('Authentication required', 401));
        }
        // Pass userId to updateAgent
        // Ensure req.body matches UpdateAgentDto expected by the service
        const updatedAgent = await agentService.updateAgent(req.params.id, req.body, req.user.id);
        // Service throws if not found
        // if (!updatedAgent) {
        //     return next(new ApiError('Agent not found', 404));
        // }
        sendSuccess(res, updatedAgent);
    } catch (error) {
         const err = error instanceof Error ? error : new Error('Failed to update agent');
         if (err.message?.includes('not found')) {
             return next(new ApiError('Agent not found', 404));
        }
        next(new ApiError(err.message || `Failed to update agent ${req.params.id}`, 500));
    }
});

// Delete an agent - Add authentication and pass userId
router.delete('/:id', authenticate, validateParams(agentIdSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
         if (!req.user) {
            return next(new ApiError('Authentication required', 401));
        }
        // Pass userId to deleteAgent
        const success = await agentService.deleteAgent(req.params.id, req.user.id);

        if (!success) {
             // This might indicate not found or other deletion failure based on service logic
            return next(new ApiError('Agent not found or could not be deleted', 404));
        }

        sendNoContent(res);
    } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to delete agent');
         if (err.message?.includes('not found')) {
             return next(new ApiError('Agent not found', 404));
        }
        next(new ApiError(err.message || `Failed to delete agent ${req.params.id}`, 500));
    }
});

export default router;