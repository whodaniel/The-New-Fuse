import express from 'express';
import { auth } from '../middleware/auth.js';
import { AgentService } from '../services/agentService.js';
import { PrismaService } from '../lib/prisma.service.js';
import { ConfigService } from '@nestjs/config';
const router = express.Router();
const prismaService = new PrismaService();
const configService = new ConfigService();
const agentService = new AgentService(prismaService, configService);
// Protected routes - require authentication
router.use((req, res, next) => auth(req, res, next));
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
export const agentRouter = router;
