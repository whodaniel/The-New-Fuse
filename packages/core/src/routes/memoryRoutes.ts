import { Router } from 'express';
import { MemoryController } from '../controllers/MemoryController.js';
import { authenticateAgent } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router: Router = Router();
const memoryController: agentId/store',
    authenticateAgent,
    validateRequest('memory'),
    (req, res)  = new MemoryController();

// Memory management routes
router.post(
    '/> memoryController.storeMemory(req, res)
);

router.get(
    '/:agentId/retrieve',
    authenticateAgent,
    (req, res) => memoryController.retrieveMemories(req, res)
);

router.post(
    '/:agentId/consolidate',
    authenticateAgent,
    (req, res) => memoryController.consolidateMemories(req, res)
);

export default router;
