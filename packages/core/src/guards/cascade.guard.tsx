import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CascadeService } from '../services/CascadeService.js';
import { REQUIRES_CASCADE_MODE, REQUIRES_CASCADE_STATE, CASCADE_CONTROLLER_ID } from '../decorators/cascade.decorators.js';

@Injectable()
export class CascadeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cascadeService: CascadeService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredMode = this.reflector.get(REQUIRES_CASCADE_MODE, context.getHandler());
    const requiredState = this.reflector.get(REQUIRES_CASCADE_STATE, context.getHandler());
    
    // If no cascade requirements, allow access
    if (!requiredMode && !requiredState) {
      return true;
    }

    const controllerId = this.reflector.get(CASCADE_CONTROLLER_ID, context.getClass());
    const controller = this.cascadeService.getController(controllerId);
    
    if (!controller) {
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

    return true;
  }
}
