"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentController = void 0;
const http_status_codes_1 = require("http-status-codes");
const agentService_1 = require("../services/agentService");
const prisma_service_1 = require("../lib/prisma.service");
const config_1 = require("@nestjs/config");
const prismaService = new prisma_service_1.PrismaService();
const configService = new config_1.ConfigService();
const agentService = new agentService_1.AgentService(prismaService);
exports.agentController = {
    createAgent: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
            }
            const agent = await agentService.createAgent(req.body, userId);
            res.status(http_status_codes_1.StatusCodes.CREATED).json(agent);
        }
        catch (error) {
            console.error('Error creating agent:', error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
        }
    },
    getAgents: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
            }
            const agents = await agentService.getAgents(userId);
            res.json(agents);
        }
        catch (error) {
            console.error('Error getting agents:', error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
        }
    },
    getAgentById: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
            }
            const agent = await agentService.getAgentById(req.params.id, userId);
            if (!agent) {
                return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: 'Agent not found' });
            }
            res.json(agent);
        }
        catch (error) {
            console.error('Error getting agent:', error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
        }
    },
    updateAgent: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
            }
            const agent = await agentService.updateAgent(req.params.id, req.body, userId);
            if (!agent) {
                return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: 'Agent not found' });
            }
            res.json(agent);
        }
        catch (error) {
            console.error('Error updating agent:', error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
        }
    },
    deleteAgent: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
            }
            await agentService.deleteAgent(req.params.id, userId);
            res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
        }
        catch (error) {
            console.error('Error deleting agent:', error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Unknown error' });
        }
    }
};
//# sourceMappingURL=agentController.js.map