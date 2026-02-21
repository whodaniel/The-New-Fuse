import { Request, Response, NextFunction } from 'express';

// Define Logger interface (can be moved to a shared types file)
interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: any) => void;
}

// Extend Express Request interface to include agentId
declare global {
  namespace Express {
    interface Request {
      agentId?: string;
    }
  }
}

/**
 * Simple API Key Authentication Middleware.
 * Checks for 'X-API-Key' header and validates against a set of known keys.
 * Attaches agentId to the request object if authentication succeeds.
 */
export const apiKeyAuth = (validKeys: Set<string>, logger: Logger) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      logger.warn('Missing or invalid API Key header');
      // Use return to stop execution after sending response
      res.status(401).json({ status: 'error', error: { message: 'Unauthorized: Missing API Key' } });
      return;
    }

    if (!validKeys.has(apiKey)) {
      logger.warn(`Invalid API Key received: ${apiKey}`);
      // Use return to stop execution after sending response
      res.status(403).json({ status: 'error', error: { message: 'Forbidden: Invalid API Key' } });
      return;
    }

    // Attach agent identifier (could be derived from the key or a lookup)
    // For simplicity, using the key itself or a generic ID
    req.agentId = `agent-${apiKey.substring(0, 5)}`;
    logger.info(`Authenticated agent: ${req.agentId}`);
    next();
  };