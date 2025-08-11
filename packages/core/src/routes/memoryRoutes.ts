import { Router } from 'express';
import { MemoryController } from '../controllers/MemoryController';
import { authenticateAgent } from '../middleware/auth';
const router = Router();
const memoryController = new MemoryController();
// Memory routes for agents
router.post('/:agentId/store', 
  authenticateAgent,
  memoryController.storeMemory
);
router.get('/:agentId/retrieve',
  authenticateAgent,
  memoryController.retrieveMemory
);
router.delete('/:agentId/clear',
  authenticateAgent,
  memoryController.clearMemory
);
export default router;