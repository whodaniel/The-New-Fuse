import express, { Request, Response } from 'express';
import { agentController } from '../controllers/agentController.js';

const router = express.Router();

router.post('/', (req: Request, res: Response) => agentController.createAgent(req, res));
router.get('/', (req: Request, res: Response) => agentController.getAgents(req, res));
router.get('/:id', (req: Request, res: Response) => agentController.getAgentById(req, res));
router.put('/:id', (req: Request, res: Response) => agentController.updateAgent(req, res));
router.delete('/:id', (req: Request, res: Response) => agentController.deleteAgent(req, res));

export { router as agentRoutes };
