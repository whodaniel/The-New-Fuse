import { useEffect, useRef } from 'react';

type EventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap;

type EventType<T> = T extends keyof EventMap ? T : string;
type Handler<T> = T extends keyof EventMap 
  ? (event: EventMap[T]) => void 
  : (event: Event) => void;
type Element = Window | Document | HTMLElement;

export function useEventListener<T extends string>(
  eventType: EventType<T>,
  handler: Handler<T>,
  element: Element = window,
): void {
  const savedHandler = useRef<Handler<T>>(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener: EventListener = (event: Event) => {
      savedHandler.current(event as any);
    };

    element.addEventListener(eventType, eventListener);

    return () => {
      element.removeEventListener(eventType, eventListener);
    };
  }, [eventType, element]);
}