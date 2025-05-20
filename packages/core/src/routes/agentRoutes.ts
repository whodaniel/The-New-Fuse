import { Router } from 'express';
import { AgentController } from '../controllers/AgentController.js';
import { authenticateAgent } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router: Router = Router();
const agentController: agentId/interact',
    authenticateAgent,
    validateRequest('interaction'),
    (req, res)  = new AgentController();

// Agent interaction routes
router.post(
    '/> agentController.processInteraction(req, res)
);

router.get(
    '/:agentId/state',
    authenticateAgent,
    (req, res) => agentController.getAgentState(req, res)
);

router.post(
    '/:agentId/reset',
    authenticateAgent,
    (req, res) => agentController.resetAgentState(req, res)
);

router.get(
    '/:agentId/metrics/performance',
    authenticateAgent,
    (req, res) => agentController.getAgentPerformance(req, res)
);

export default router;
