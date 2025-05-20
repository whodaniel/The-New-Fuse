import { Router } from 'express';
import agentRoutes from './agentRoutes.js';
import memoryRoutes from './memoryRoutes.js';
import socialRoutes from './socialRoutes.js';

const router: Router = Router();

// Register all routes
router.use('/agents', agentRoutes);
router.use('/memory', memoryRoutes);
router.use('/social', socialRoutes);

export default router;
