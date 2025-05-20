```typescript
// ...existing code...

  removeEventListener<K extends keyof WebSocketManagerEventMap>(
    type: K,
    listener: (this: WebSocketManager, ev: WebSocketManagerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type, callback as EventListener, options);
  }

// ...existing code...
```