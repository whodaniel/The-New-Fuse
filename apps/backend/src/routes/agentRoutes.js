import express from 'express';
import { agentController } from '../controllers/agentController.js';
const router = express.Router();
router.post('/', (req, res) => agentController.createAgent(req, res));
router.get('/', (req, res) => agentController.getAgents(req, res));
router.get('/:id', (req, res) => agentController.getAgentById(req, res));
router.put('/:id', (req, res) => agentController.updateAgent(req, res));
router.delete('/:id', (req, res) => agentController.deleteAgent(req, res));
export { router as agentRoutes };
