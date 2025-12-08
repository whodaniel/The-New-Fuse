import express, { Router } from 'express';
import { getMarketplaceServers, installServer } from '../controllers/mcpControllerExpress';

const router: Router = express.Router();

router.get('/marketplace/servers', getMarketplaceServers);
router.post('/servers/install', installServer);

export default router;
