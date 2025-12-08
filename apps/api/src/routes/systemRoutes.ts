import express, { Router } from 'express';
import { getSystemHealth } from '../controllers/systemControllerExpress';

const router: Router = express.Router();

router.get('/health', getSystemHealth);

export default router;
