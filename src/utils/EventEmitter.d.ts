type EventCallback = (...args: unknown[]) => void;
export declare class EventEmitter {
  private events;
  constructor();
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
  emit(event: string, ...args: unknown[]): void;
  removeAllListeners(event?: string): void;
}
export {};
