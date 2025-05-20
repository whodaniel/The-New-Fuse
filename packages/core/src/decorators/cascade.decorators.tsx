import { SetMetadata } from '@nestjs/common';
import { CascadeMode, CascadeState } from '../types/cascade.js';

export const REQUIRES_CASCADE_MODE = 'requires_cascade_mode';
export const REQUIRES_CASCADE_STATE = 'requires_cascade_state';
export const CASCADE_CONTROLLER_ID = 'cascade_controller_id';

export const RequiresCascadeMode = (mode: CascadeMode) => SetMetadata(REQUIRES_CASCADE_MODE, mode);
export const RequiresCascadeState = (state: CascadeState) => SetMetadata(REQUIRES_CASCADE_STATE, state);
export const CascadeControllerId = (id: string) => SetMetadata(CASCADE_CONTROLLER_ID, id);

export interface CascadeMethodOptions {
  mode?: CascadeMode;
  state?: CascadeState;
  controllerId?: string;
  autoActivate?: boolean;
  autoDeactivate?: boolean;
}

export function CascadeMethod(options: CascadeMethodOptions = {}): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const cascadeService = Reflect.getMetadata('cascade_service', target.constructor);

      if (!cascadeService) {
        console.error('CascadeService not injected or available on target:', target);
        throw new Error('CascadeService not injected');
      }
      
      const controllerId = options.controllerId || Reflect.getMetadata(CASCADE_CONTROLLER_ID, target.constructor) || propertyKey.toString();
      let controller = cascadeService.getController(controllerId);

      if (!controller) {
        controller = cascadeService.createController(controllerId, { defaultMode: options.mode, defaultState: options.state });
      } else {
         if (options.mode) controller.setMode(options.mode);
      }

      if (options.autoActivate && controller && typeof controller.activate === 'function') {
        await controller.activate();
      }

      let result;
      try {
        result = await originalMethod.apply(this, args);
      } catch (error) {
        throw error;
      } finally {
        if (options.autoDeactivate && controller && typeof controller.deactivate === 'function') {
          await controller.deactivate();
        }
      }
      return result;
    };

    return descriptor;
  };
}

export function CascadeDelete(options?: { relation: string; cascade?: boolean }): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    // ...existing code...
  };
}

export function CascadeUpdate(options?: { relation: string; cascade?: boolean }): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    // ...existing code...
  };
}

export function CascadeSoftDelete(options?: { relation: string; cascade?: boolean }): PropertyDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    // descriptor?: TypedPropertyDescriptor<any> // Assuming descriptor might be optional or not used based on errors
  ) {
    // ...existing code...
  };
}

async function exampleFunctionOrMethod() {
  try {
    // ... existing code around line 24-30
    const someObject = {
      prop1: 'value1',
      prop2: 'value2',
    };
    // ... existing code around line 33-41
    const anotherObject = {
      configA: true,
      configB: 123,
      nested: {
        subProp: 'test',
      },
    };
    // ... more code
  } catch (error) {
    console.error("Error in exampleFunctionOrMethod", error);
  }
}
