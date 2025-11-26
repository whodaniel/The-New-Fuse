import express, { Request, Response, NextFunction } from 'express';
import { agentController } from '../controllers/agentController';
import { User } from '../types/auth'; // Import User for mock user typing

const router = express.Router();

// Toggle this flag to enable/disable authentication requirement
const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== 'false';

// Use Request from Express, which should be augmented globally
function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (!REQUIRE_AUTH) {
    // In dev mode, inject a mock user if not present
    if (!req.user) {
      req.user = {
        id: 'dev-user',
        email: 'dev@local',
        name: 'Dev User',
      } as User; // Explicitly cast to our User type
    }
    return next();
  }
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    return;
  }
  next();
}

router.post('/', ensureAuthenticated, async (req: Request, res: Response) => {
  await agentController.createAgent(req, res);
});
router.get('/', ensureAuthenticated, async (req: Request, res: Response) => {
  await agentController.getAgents(req, res);
});
router.get('/:id', ensureAuthenticated, async (req: Request, res: Response) => {
  await agentController.getAgentById(req, res);
});
router.put('/:id', ensureAuthenticated, async (req: Request, res: Response) => {
  await agentController.updateAgent(req, res);
});
router.delete('/:id', ensureAuthenticated, async (req: Request, res: Response) => {
  await agentController.deleteAgent(req, res);
});

export { router as agentRoutes };
