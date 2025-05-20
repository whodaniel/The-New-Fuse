import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AgentService } from '../services/agentService.js';
import { PrismaService } from '../lib/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { Agent, CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

const prismaService = new PrismaService();
const configService = new ConfigService();
const agentService = new AgentService(prismaService, configService);

export const agentController = {
  createAgent: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }
      const agent = await agentService.createAgent(req.body, userId);
      res.status(StatusCodes.CREATED).json(agent);
    } catch (error: any) {
      console.error('Error creating agent:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
    }
  },

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
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
    }
  },

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
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
    }
  },

  updateAgent: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }
      const agent = await agentService.updateAgent(req.params.id, req.body, userId);
      if (!agent) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error: any) {
      console.error('Error updating agent:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
    }
  },

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
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
    }
  }
};
