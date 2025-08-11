import { Router } from 'express';
import { SocialController } from '../controllers/SocialController';
import { authenticateAgent } from '../middleware/auth';
const router = Router();
const socialController = new SocialController();
// Social interaction routes for agents
router.post('/:agentId/interact', 
  authenticateAgent,
  socialController.interact
);
router.get('/:agentId/preferences',
  authenticateAgent,
  socialController.getPreferences
);
router.put('/:agentId/preferences',
  authenticateAgent,
  socialController.updatePreferences
);
router.get('/:agentId/connections',
  authenticateAgent,
  socialController.getConnections
);
export default router;