import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const logger = new Logger('BackCompatMiddleware');

export function backCompatMiddleware(req: Request, _res: Response, next: NextFunction) {
  const originalUrl = req.url;
  if (originalUrl.startsWith('/api/auth/')) {
    req.url = originalUrl.replace('/api/auth', '/api/v1/auth');
    logger.log(`Rewrote: ${originalUrl} -> ${req.url}`);
  } else if (originalUrl === '/api/auth') {
    req.url = '/api/v1/auth';
    logger.log(`Rewrote: ${originalUrl} -> ${req.url}`);
  }
  next();
}
