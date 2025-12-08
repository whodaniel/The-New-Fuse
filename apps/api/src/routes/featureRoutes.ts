import express, { Router } from 'express';
import { getFeatureFlags, updateFeatureFlag } from '../controllers/featureControllerExpress';

const router: Router = express.Router();

router.get('/', getFeatureFlags);
router.put('/:id', updateFeatureFlag);

export default router;
