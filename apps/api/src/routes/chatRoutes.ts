import express, { Router } from 'express';
import { imageGeneration, textCompletion } from '../controllers/chatControllerExpress';

const router: Router = express.Router();

router.post('/text-completion', textCompletion);
router.post('/image-generation', imageGeneration);

export default router;
