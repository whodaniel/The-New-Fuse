import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

// Add explicit Router type
const router: Router = Router();

// Define the MCP routes
router.post('/message', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Fix for the error related to accessing req.user.id
    const sender = req.user?.id || 'anonymous';
    
    // Process the message
    const { content, recipient } = req.body;
    
    // Implementation would go here
    
    res.status(200).json({
      success: true,
      data: {
        sender,
        recipient,
        status: 'delivered'
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;