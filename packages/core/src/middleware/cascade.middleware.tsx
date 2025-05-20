import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CascadeService } from '../services/CascadeService.js';
import { REQUIRES_CASCADE_MODE, REQUIRES_CASCADE_STATE, CASCADE_CONTROLLER_ID } from '../decorators/cascade.decorators.js';

@Injectable()
export class CascadeMiddleware implements NestMiddleware {
  constructor(private readonly cascadeService: CascadeService) {}

  async use(): Promise<void> {req: Request, res: Response, next: NextFunction): Promise<any> {
    const handler): void {
      return next()): void {
      return next()): void {
      throw new ForbiddenException(`Cascade controller '${controllerId}' not found`);
    }

    if (requiredMode && controller.getMode() !== requiredMode) {
      throw new ForbiddenException(
        `Operation requires Cascade mode '${requiredMode}' but current mode is '${controller.getMode()}'`
      );
    }

    if (requiredState && controller.getState() !== requiredState) {
      throw new ForbiddenException(
        `Operation requires Cascade state '${requiredState}' but current state is '${controller.getState()}'`
      );
    }

    next();
  }
}
