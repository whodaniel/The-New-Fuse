type EventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap;
type EventType<T> = T extends keyof EventMap ? T : string;
type Handler<T> = T extends keyof EventMap ? (event: EventMap[T]) => void : (event: Event) => void;
type Element = Window | Document | HTMLElement;
export declare function useEventListener<T extends string>(eventType: EventType<T>, handler: Handler<T>, element?: Element): void;
export {};
