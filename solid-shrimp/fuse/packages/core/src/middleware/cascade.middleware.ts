import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CascadeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CascadeMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log('Cascade middleware is running...');
    next();
  }
}
