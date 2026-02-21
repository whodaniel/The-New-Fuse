// filepath: src/utils/events/event-emitter.ts
import { EventEmitter } from "events";

export type EventHandler<T = any> = (data: T) => void;

export class TypedEventEmitter<Events extends Record<string, any>> {
  private emitter = new EventEmitter();

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): this {
    this.emitter.on(event as string, handler);
    return this;
  }

  once<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>,
  ): this {
    this.emitter.once(event as string, handler);
    return this;
  }

  off<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>,
  ): this {
    this.emitter.off(event as string, handler);
    return this;
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): boolean {
    return this.emitter.emit(event as string, data);
  }

  removeAllListeners<K extends keyof Events>(event: K): this {
    this.emitter.removeAllListeners(event as string);
    return this;
  }
}

export default TypedEventEmitter;
