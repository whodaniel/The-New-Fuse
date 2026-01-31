/**
 * NestJS Common stub for browser builds
 *
 * This file stubs out @nestjs/common which is a Node.js-only module
 * that should never be imported in browser code.
 */

// Stub Logger class
export class Logger {
  static verbose(..._args: unknown[]): void {}
  static debug(..._args: unknown[]): void {}
  static log(..._args: unknown[]): void {}
  static warn(..._args: unknown[]): void {}
  static error(..._args: unknown[]): void {}

  constructor(_context?: string) {}
  verbose(..._args: unknown[]): void {}
  debug(..._args: unknown[]): void {}
  log(..._args: unknown[]): void {}
  warn(..._args: unknown[]): void {}
  error(..._args: unknown[]): void {}
}

// Stub decorators (return identity function)
export const Injectable = () => (target: unknown) => target;
export const Global = () => (target: unknown) => target;
export const Module = () => (target: unknown) => target;
export const Controller = () => (target: unknown) => target;
export const Get = () => (_target: unknown, _key?: string) => {};
export const Post = () => (_target: unknown, _key?: string) => {};
export const Put = () => (_target: unknown, _key?: string) => {};
export const Delete = () => (_target: unknown, _key?: string) => {};
export const Patch = () => (_target: unknown, _key?: string) => {};
export const Inject = () => (_target: unknown, _key?: string) => {};
export const Optional = () => (_target: unknown, _key?: string) => {};
export const Param = () => (_target: unknown, _key?: string, _index?: number) => {};
export const Query = () => (_target: unknown, _key?: string, _index?: number) => {};
export const Body = () => (_target: unknown, _key?: string, _index?: number) => {};

// Stub common interfaces/types
export interface OnModuleInit {
  onModuleInit(): Promise<void> | void;
}

export interface OnModuleDestroy {
  onModuleDestroy(): Promise<void> | void;
}

export default {};
