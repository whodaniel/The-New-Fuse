/// <reference lib="dom" />
import { JsonValue } from '@the-new-fuse/types';

declare global {
  interface Window {
    localStorage: Storage;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    matchMedia: (query: string) => MediaQueryList;
    console: Console;
  }

  interface Storage {
    readonly length: number;
    clear(): void;
    getItem(key: string): string | null;
    key(index: number): string | null;
    removeItem(key: string): void;
    setItem(key: string, value: string): void;
  }

  interface AddEventListenerOptions {
    capture?: boolean;
    once?: boolean;
    passive?: boolean;
  }

  interface EventListenerOptions {
    capture?: boolean;
  }

  interface Event {}

  interface EventTarget {}

  interface MediaQueryListEvent extends Event {
    readonly matches: boolean;
  }

  interface MediaQueryList extends EventTarget {
    readonly matches: boolean;
    readonly media: string;
    onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null;
    addListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown): void;
    removeListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown): void;
    addEventListener(type: string, listener: (event: MediaQueryListEvent) => void): void;
    removeEventListener(type: string, listener: (event: MediaQueryListEvent) => void): void;
  }

  interface Console {
    log(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    debug(message?: any, ...optionalParams: any[]): void;
  }

  var window: Window & typeof globalThis;
  var console: Console;
  var localStorage: Storage;

  interface ThemeOptions {
    colors: Record<string, JsonValue>;
    fonts: Record<string, string>;
  }
}

export {};