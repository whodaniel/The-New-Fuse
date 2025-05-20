import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { CascadeController, CascadeMode, CascadeState, CascadeOptions } from '../types/cascade.js';
import { CascadeEventMap, CascadeEventType, CascadeEventPayload } from '../types/cascade.events.js';

@Injectable()
export class CascadeService {
  private readonly controllers: Map<string, CascadeController>;
  private readonly eventEmitter: EventEmitter;

  constructor() {
    this.controllers = new Map();
    this.eventEmitter = new EventEmitter();
  }

  public createController(id: string, options?: CascadeOptions): CascadeController {
    if (this.controllers.has(id)) {
      throw new Error(`Controller with id ${id} already exists`);
    }

    const controller = new CascadeController(options);
    this.controllers.set(id, controller);

    // Forward all controller events to the service event emitter
    controller.on('modeChange', (event) => {
      this.eventEmitter.emit('modeChange', { controllerId: id, ...event });
    });

    controller.on('stateChange', (event) => {
      this.eventEmitter.emit('stateChange', { controllerId: id, ...event });
    });

    controller.on('metadataUpdate', (event) => {
      this.eventEmitter.emit('metadataUpdate', { controllerId: id, ...event });
    });

    controller.on('error', (event) => {
      this.eventEmitter.emit('error', { controllerId: id, ...event });
    });

    return controller;
  }

  public getController(id: string): CascadeController | undefined {
    return this.controllers.get(id);
  }

  public addEventListener<T extends keyof CascadeEventMap>(
    event: T,
    listener: (event: CascadeEventPayload<T> & { controllerId: string }) => void
  ): void {
    this.eventEmitter.on(event, listener);
  }

  public removeEventListener<T extends keyof CascadeEventMap>(
    event: T,
    listener: (event: CascadeEventPayload<T> & { controllerId: string }) => void
  ): void {
    this.eventEmitter.off(event, listener);
  }

  public removeController(id: string): boolean {
    const controller = this.controllers.get(id);
    if (controller) {
      controller.removeAllListeners();
      return this.controllers.delete(id);
    }
    return false;
  }

  public getActiveControllers(): Array<{ id: string; controller: CascadeController }> {
    return Array.from(this.controllers.entries())
      .filter(([_, controller]) => controller.isActive())
      .map(([id, controller]) => ({ id, controller }));
  }

  public getWriteModeControllers(): Array<{ id: string; controller: CascadeController }> {
    return Array.from(this.controllers.entries())
      .filter(([_, controller]) => controller.isWriteMode())
      .map(([id, controller]) => ({ id, controller }));
  }

  public async synchronizeControllers(ids: string[]): Promise<void> {
    const controllers = ids
      .map(id => this.controllers.get(id))
      .filter((controller): controller is CascadeController => controller !== undefined);

    if (controllers.length !== ids.length) {
      throw new Error('One or more controllers not found');
    }

    const firstController = controllers[0];
    const mode = firstController.getMode();
    const state = firstController.getState();
    const context = firstController.getContext();

    controllers.forEach(controller => {
      if (controller !== firstController) {
        controller.setMode(mode);
        controller.setState(state);
      }
    });
  }

  public dispose(): void {
    this.controllers.forEach(controller => {
      controller.removeAllListeners();
    });
    this.controllers.clear();
    this.eventEmitter.removeAllListeners();
  }
}
