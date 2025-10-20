import { Router, Request, Response, NextFunction } from 'express';
import { AgentService } from '../services/agent.service';
import { PrismaService } from '../services/prisma.service';
import { AgentRepository } from '../repositories/agent.repository';
import { ApiError } from '../middleware/error.middleware';
import { authenticate } from '../middleware/auth';
import { sendNoContent, sendSuccess, sendCreated } from '../utils/response.util';
import { validateParams, validateBody } from '../middleware/validation.middleware';
import { agentIdSchema, createAgentSchema, updateAgentSchema } from '../schemas/agent.schema';

// User interface for type safety
interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const router: Router = Router();
const prismaService = new PrismaService();
const agentRepository = new AgentRepository(prismaService);
const agentService = new AgentService(
  agentRepository,
  new (class {
    async detectAndCreateAgents(): Promise<any[]> { return []; }
    async getAvailableProviders(): Promise<string[]> { return []; }
  })()
);

// Get all agents - Add authentication and pass userId
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError('Authentication required', 401));
        }
        const agents = await agentService.getAgents((req.user as User).id);
        sendSuccess(res, agents);
    } catch (err: any) {
        next(new ApiError(err.message || 'Failed to fetch agents', 500));
    }
});

// Get agent by ID - Add authentication and pass userId
router.get('/:id', authenticate, validateParams(agentIdSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
         if (!req.user) {
            return next(new ApiError('Authentication required', 401));
        }
        const agent = await agentService.getAgentById(req.params.id, (req.user as User).id);
        if (!agent) {
            return next(new ApiError('Agent not found', 404));
        }
        sendSuccess(res, agent);
    } catch (err: any) {
        next(new ApiError(err.message || `Failed to fetch agent ${req.params.id}`, 500));
    }
});

// Create a new agent - Add authentication and pass userId
router.post('/', authenticate, validateBody(createAgentSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
         if (!req.user) {
            return next(new ApiError('Authentication required', 401));
        }
        const newAgent = await agentService.createAgent(req.body, (req.user as User).id);
        sendCreated(res, newAgent);
    } catch (err: any) {
        next(new ApiError(err.message || 'Failed to create agent', 500));
    }
});

// Update an agent - Add authentication and pass userId
router.put('/:id', authenticate, validateParams(agentIdSchema), validateBody(updateAgentSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
         if (!req.user) {
            return next(new ApiError('Authentication required', 401));
        }
        const updatedAgent = await agentService.updateAgent(req.params.id, req.body, (req.user as User).id);
        if (!updatedAgent) {
            return next(new ApiError('Agent not found', 404));
        }
        sendSuccess(res, updatedAgent);
    } catch (err: any) {
        next(new ApiError(err.message || `Failed to update agent ${req.params.id}`, 500));
    }
});

// Delete an agent - Add authentication and pass userId
router.delete('/:id', authenticate, validateParams(agentIdSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
         if (!req.user) {
            return next(new ApiError('Authentication required', 401));
        }
        const success = await agentService.deleteAgent(req.params.id, (req.user as User).id);

        if (!success) {
            return next(new ApiError('Agent not found or could not be deleted', 404));
        }

        sendNoContent(res);
    } catch (err: any) {
        next(new ApiError(err.message || `Failed to delete agent ${req.params.id}`, 500));
    }
});

export default router;