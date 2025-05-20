import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { AgentService } from '../modules/services/agent.service.js';

// Add explicit Router type
const router: Router = Router();
const agentService = new AgentService({} as any); // This would normally be injected

// Get all agents
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use the newly implemented getAgents method from the AgentService
    const agents = await agentService.getAgents(req.user?.id || '');
    res.status(200).json({ agents });
  } catch (error) {
    next(error);
  }
});

// Get agent by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use the newly implemented getAgentById method
    const agent = await agentService.getAgentById(req.params.id, req.user?.id || '');
    
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    res.status(200).json({ agent });
  } catch (error) {
    next(error);
  }
});

// Create a new agent
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use the newly implemented createAgent method
    const newAgent = await agentService.createAgent(req.body, req.user?.id || '');
    res.status(201).json({ agent: newAgent });
  } catch (error) {
    next(error);
  }
});

// Update agent
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use the newly implemented updateAgent method
    const updatedAgent = await agentService.updateAgent(req.params.id, req.body, req.user?.id || '');
    
    if (!updatedAgent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    res.status(200).json({ agent: updatedAgent });
  } catch (error) {
    next(error);
  }
});

// Delete agent
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use the newly implemented deleteAgent method
    const success = await agentService.deleteAgent(req.params.id, req.user?.id || '');
    
    if (!success) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;