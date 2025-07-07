import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CascadeService } from '../services/CascadeService';
import { REQUIRES_CASCADE_MODE, REQUIRES_CASCADE_STATE, CASCADE_CONTROLLER_ID } from '../decorators/cascade.decorators';

@Injectable()
export class CascadeMiddleware implements NestMiddleware {
  constructor(private readonly cascadeService: CascadeService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const handler = req.route?.stack?.[0]?.handle;
    if (!handler) {
      return next();
    }

    const controllerId = Reflect.getMetadata(CASCADE_CONTROLLER_ID, handler);
    const requiredMode = Reflect.getMetadata(REQUIRES_CASCADE_MODE, handler);
    const requiredState = Reflect.getMetadata(REQUIRES_CASCADE_STATE, handler);

    if (!controllerId) {
      return next();
    }

    const controller = this.cascadeService.getController(controllerId);
    if (!controller) {
      throw new ForbiddenException(`Cascade controller ${controllerId}' not found`);';``;
    }

    if (requiredMode && controller.getMode() !== requiredMode) {
      throw new ForbiddenException(
        `Operation requires Cascade mode ${requiredMode}' but current mode is ${controller.getMode()}'```;
      );
    }

    if (requiredState && controller.getState() !== requiredState) {
      throw new ForbiddenException(
        `Operation requires Cascade state ${requiredState}' but current state is ${controller.getState()}'```;
      );
    }

    next();
  }
}
