interface Storage {
  readonly length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

interface Event {
  readonly type: string;
}

interface EventListenerOrEventListenerObject {}

interface AddEventListenerOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
}

interface EventListenerOptions {
  capture?: boolean;
}

interface EventTarget {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
  dispatchEvent(event: Event): boolean;
}

interface Console {
  log(message?: unknown, ...optionalParams: unknown[]): void;
  error(message?: unknown, ...optionalParams: unknown[]): void;
  warn(message?: unknown, ...optionalParams: unknown[]): void;
  info(message?: unknown, ...optionalParams: unknown[]): void;
  debug(message?: unknown, ...optionalParams: unknown[]): void;
}

interface Window extends EventTarget {
  localStorage: Storage;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface URL {
  readonly href: string;
  readonly origin: string;
  readonly protocol: string;
  readonly username: string;
  readonly password: string;
  readonly host: string;
  readonly hostname: string;
  readonly port: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
}

interface Buffer extends Uint8Array {
  readUInt8(offset: number): number;
  writeUInt8(value: number, offset: number): void;
}

declare namespace NodeJS {
  interface ProcessEnv {}
  interface Global {
    process: NodeJS.Process;
  }
}

declare var global: typeof globalThis;

declare var process: NodeJS.Process;
declare var window: Window & typeof globalThis;
declare var console: Console;
declare var localStorage: Storage;

interface MediaQueryListEvent extends Event {
  readonly matches: boolean;
}

interface MediaQueryList extends EventTarget {
  readonly matches: boolean;
  readonly media: string;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null;
  addListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void): void;
  removeListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void): void;
}

declare var setTimeout: (callback: (...args: unknown[]) => void, ms: number, ...args: unknown[]) => number;
