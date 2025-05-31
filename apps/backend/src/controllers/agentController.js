import { StatusCodes } from 'http-status-codes';
import { AgentService } from '../services/agentService.js';
import { PrismaService } from '../lib/prisma.service.js';
import { ConfigService } from '@nestjs/config';
const prismaService = new PrismaService();
const configService = new ConfigService();
const agentService = new AgentService(prismaService, configService);
export const agentController = {
    createAgent: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
            }
            const agent = await agentService.createAgent(req.body, userId);
            res.status(StatusCodes.CREATED).json(agent);
        }
        catch (error) {
            console.error('Error creating agent:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
        }
    },
    getAgents: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
            }
            const agents = await agentService.getAgents(userId);
            res.json(agents);
        }
        catch (error) {
            console.error('Error getting agents:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
        }
    },
    getAgentById: async (req, res) => {
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
        }
        catch (error) {
            console.error('Error getting agent:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
        }
    },
    updateAgent: async (req, res) => {
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
        }
        catch (error) {
            console.error('Error updating agent:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
        }
    },
    deleteAgent: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
            }
            await agentService.deleteAgent(req.params.id, userId);
            res.status(StatusCodes.NO_CONTENT).send();
        }
        catch (error) {
            console.error('Error deleting agent:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
        }
    }
};
