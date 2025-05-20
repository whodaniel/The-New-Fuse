import { Router } from 'express';
import { SocialController } from '../controllers/SocialController.js';
import { authenticateAgent } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router: Router = Router();
const socialController: agentId/interact',
    authenticateAgent,
    validateRequest('socialInteraction'),
    (req, res)  = new SocialController();

// Social interaction routes
router.post(
    '/> socialController.processSocialInteraction(req, res)
);

router.get(
    '/:agentId/metrics',
    authenticateAgent,
    (req, res) => socialController.getSocialMetrics(req, res)
);

router.put(
    '/:agentId/preferences',
    authenticateAgent,
    validateRequest('socialPreferences'),
    (req, res) => socialController.updateSocialPreferences(req, res)
);

export default router;
