declare module '*.css';

interface ImportMetaEnv {
  readonly VITE_ARCADE_BACKEND_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_COMMUNITY_API_URL?: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<{ meta?: { changes?: number } }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown>;
}

interface R2ObjectBody {
  text(): Promise<string>;
}

interface R2Object {
  body: R2ObjectBody | ReadableStream<Uint8Array> | null;
}

interface R2Bucket {
  head(key: string): Promise<{
    uploaded: Date;
    size: number;
  } | null>;
  get(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream<Uint8Array> | Blob | null,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
    }
  ): Promise<unknown>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ExportedHandler<Env = unknown> {
  fetch(request: Request, env: Env, ctx?: ExecutionContext): Response | Promise<Response>;
}

interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface PagesEnv {
  ASSETS: Fetcher;
  [key: string]: unknown;
}

interface PagesFunctionContext<Env = PagesEnv> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil(promise: Promise<unknown>): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
  data?: unknown;
}

declare module 'pokersolver' {
  export const Hand: {
    solve(cards: string[]): {
      rank: number;
      descr: string;
      cards: Array<{ value: string; suit: string }>;
    };
    winners(hands: Array<{ rank: number }>): Array<{ rank: number }>;
  };
}

declare module '*.mjs' {
  const moduleExports: any;
  export default moduleExports;
}
