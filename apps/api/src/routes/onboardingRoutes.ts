import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/api/onboarding/start', (req: Request, res: Response) => {
  // In a real application, more sophisticated detection logic would be here.
  // This could involve analyzing request headers, IP address, user agent,
  // authentication tokens, or other specific markers.
  const isAgentRequest = Math.random() > 0.5; // 50% chance for demo

  if (isAgentRequest) {
    res.json({ userType: 'ai_agent' });
  } else {
    res.json({ userType: 'human' });
  }
});

export default router;
