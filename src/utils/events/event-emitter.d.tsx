export type EventHandler<T = any> = (data: T) => void;
export declare class TypedEventEmitter<Events extends Record<string, any>> {
  private emitter;
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): this;
  once<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>,
  ): this;
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): this;
  emit<K extends keyof Events>(event: K, data: Events[K]): boolean;
  removeAllListeners<K extends keyof Events>(event?: K): this;
}
export default TypedEventEmitter;
