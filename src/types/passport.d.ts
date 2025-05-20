/**
 * Type declarations for passport module
 */

declare module "passport" {
  import express from "express";

  export interface Authenticator {
    use(strategy: unknown): this;
    initialize(): express.RequestHandler;
    session(options?: unknown): express.RequestHandler;
    authenticate(
      strategy: string | string[],
      options?: unknown,
    ): express.RequestHandler;
    serializeUser(
      fn: (user: unknown, done: (err: unknown, id?: unknown) => void) => void,
    ): void;
    deserializeUser(
      fn: (id: unknown, done: (err: unknown, user?: unknown) => void) => void,
    ): void;
  }

  const passport: Authenticator;
  export default passport;
}
