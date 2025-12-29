import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CreateAgentDto, UpdateAgentDto } from '../dto';
import { AgentService } from '../services/agentService';

// Extend Express Request to include user with id property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
}

const agentService = new AgentService();

/**
 * Agent Controller
 *
 * Handles agent CRUD operations with input validation.
 * Uses DTOs for automatic validation through global ValidationPipe.
 */
export const agentController = {
  /**
   * Create a new agent with validated input
   */
  createAgent: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }

      // Input validation handled by global ValidationPipe with CreateAgentDto
      const agentData = req.body as CreateAgentDto;

      const agent = await agentService.createAgent(agentData, userId);
      res.status(StatusCodes.CREATED).json(agent);
    } catch (error: any) {
      console.error('Error creating agent:', error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message || 'Unknown error' });
    }
  },

  /**
   * Get all agents for authenticated user
   */
  getAgents: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }
      const agents = await agentService.getAgents(userId);
      res.json(agents);
    } catch (error: any) {
      console.error('Error getting agents:', error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message || 'Unknown error' });
    }
  },

  /**
   * Get agent by ID
   */
  getAgentById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }
      const agent = await agentService.getAgentById(req.params.id, userId);
      if (!agent) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error: any) {
      console.error('Error getting agent:', error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message || 'Unknown error' });
    }
  },

  /**
   * Update agent with validated input
   */
  updateAgent: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }

      // Input validation handled by global ValidationPipe with UpdateAgentDto
      const updateData = req.body as UpdateAgentDto;

      const agent = await agentService.updateAgent(req.params.id, updateData, userId);
      if (!agent) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error: any) {
      console.error('Error updating agent:', error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message || 'Unknown error' });
    }
  },

  /**
   * Delete agent
   */
  deleteAgent: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }
      await agentService.deleteAgent(req.params.id, userId);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message || 'Unknown error' });
    }
  },
};
