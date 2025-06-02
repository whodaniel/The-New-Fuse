import express from 'express';
import { agentController } from '../controllers/agentController.js';

const router = express.Router();

// Toggle this flag to enable/disable authentication requirement
const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== 'false';

function ensureAuthenticated(req, res, next) {
  if (!REQUIRE_AUTH) {
    // In dev mode, inject a mock user if not present
    if (!req.user) {
      req.user = {
        id: 'dev-user',
        email: 'dev@local',
        name: 'Dev User',
        // Add any other fields your app expects on User
      };
    }
    return next();
  }
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }
  next();
}

router.post('/', ensureAuthenticated, (req, res) => agentController.createAgent(req, res));
router.get('/', ensureAuthenticated, (req, res) => agentController.getAgents(req, res));
router.get('/:id', ensureAuthenticated, (req, res) => agentController.getAgentById(req, res));
router.put('/:id', ensureAuthenticated, (req, res) => agentController.updateAgent(req, res));
router.delete('/:id', ensureAuthenticated, (req, res) => agentController.deleteAgent(req, res));

export { router as agentRoutes };
