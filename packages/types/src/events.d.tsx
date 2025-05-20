/// <reference lib="dom" />
/* global EventTarget, CustomEvent */

import { UnknownRecord } from './core/base-types.js';

// Event types are now defined in ws.d.ts
declare global {
  /*
  interface Event {
    // currentTarget?: EventTarget | null;
    // bubbles?: boolean;
    // cancelable?: boolean;
    // defaultPrevented?: boolean;
    // timeStamp?: number;
    // preventDefault?(): void;
    // stopPropagation?(): void;
    // stopImmediatePropagation?(): void;
  }

  interface CustomEventInit<T = unknown> {}
  interface CustomEvent<T = unknown> extends Event {}
  */
}

type EventPayload = UnknownRecord;
type EventHandler<T = unknown> = (event: CustomEvent<T>) => void;

interface CustomEventMap {
  // ...existing code...
}

declare global {
  interface WindowEventMap extends CustomEventMap {}
}
