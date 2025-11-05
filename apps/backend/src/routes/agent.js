"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const agentService_1 = require("../services/agentService");
const prisma_service_1 = require("../lib/prisma.service");
const config_1 = require("@nestjs/config");
const router = express_1.default.Router();
const prismaService = new prisma_service_1.PrismaService();
const configService = new config_1.ConfigService();
const agentService = new agentService_1.AgentService(prismaService, configService);
// Protected routes - require authentication
router.use((req, res, next) => (0, auth_1.auth)(req, res, next));
// Get all agents
router.get('/', async (req, res) => {
    try {
        const agents = await agentService.getAgents(req.user.id);
        res.json({ success: true, agents });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching agents',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Create new agent
router.post('/', async (req, res) => {
    try {
        const agent = await agentService.createAgent(req.body, req.user.id);
        res.json({ success: true, agent });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating agent',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Get agent by ID
router.get('/:id', async (req, res) => {
    try {
        const agent = await agentService.getAgentById(req.params.id, req.user.id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }
        res.json({ success: true, agent });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching agent',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Update agent
router.put('/:id', async (req, res) => {
    try {
        const agent = await agentService.updateAgent(req.params.id, req.body, req.user.id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }
        res.json({ success: true, agent });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating agent',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// Delete agent
router.delete('/:id', async (req, res) => {
    try {
        await agentService.deleteAgent(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Agent deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting agent',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.agentRouter = router;
//# sourceMappingURL=agent.js.map