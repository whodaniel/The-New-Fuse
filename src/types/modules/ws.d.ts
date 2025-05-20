// filepath: src/types/modules/ws.d.ts
declare module "ws" {
  import { EventEmitter } from "events";
  import * as http from "http";
  import * as net from "net";
  import * as stream from "stream";

  class WebSocket extends EventEmitter {
    static CONNECTING: number;
    static OPEN: number;
    static CLOSING: number;
    static CLOSED: number;

    binaryType: string;
    bufferedAmount: number;
    extensions: string;
    protocol: string;
    readyState: number;
    url: string;

    constructor(
      address: string | URL,
      protocols?: string | string[],
      options?: WebSocket.ClientOptions,
    );
    constructor(address: string | URL, options?: WebSocket.ClientOptions);

    close(code?: number, data?: string | Buffer): void;
    ping(data?: unknown, mask?: boolean, cb?: (err?: Error) => void): void;
    pong(data?: unknown, mask?: boolean, cb?: (err?: Error) => void): void;
    send(data: unknown, cb?: (err?: Error) => void): void;
    send(
      data: unknown,
      options: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
      },
      cb?: (err?: Error) => void,
    ): void;
    terminate(): void;

    on(event: "close", listener: (code: number, reason: string) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "message", listener: (data: WebSocket.Data) => void): this;
    on(event: "open", listener: () => void): this;
    on(event: "ping" | "pong", listener: (data: Buffer) => void): this;
    on(event: string | symbol, listener: (...args: unknown[]) => void): this;
  }

  namespace WebSocket {
    export interface ClientOptions {
      protocol?: string;
      handshakeTimeout?: number;
      perMessageDeflate?: boolean | PerMessageDeflateOptions;
      localAddress?: string;
      protocolVersion?: number;
      headers?: { [key: string]: string };
      origin?: string;
      agent?: http.Agent;
      host?: string;
      family?: number;
      checkServerIdentity?(servername: string, cert: unknown): boolean;
      rejectUnauthorized?: boolean;
      maxPayload?: number;
      followRedirects?: boolean;
      maxRedirects?: number;
    }

    export interface PerMessageDeflateOptions {
      serverNoContextTakeover?: boolean;
      clientNoContextTakeover?: boolean;
      serverMaxWindowBits?: number;
      clientMaxWindowBits?: number;
      zlibDeflateOptions?: {
        flush?: number;
        finishFlush?: number;
        chunkSize?: number;
        windowBits?: number;
        level?: number;
        memLevel?: number;
        strategy?: number;
        dictionary?: Buffer | Buffer[] | DataView;
        info?: boolean;
      };
      zlibInflateOptions?: unknown;
      threshold?: number;
      concurrencyLimit?: number;
    }

    export type Data = string | Buffer | ArrayBuffer | Buffer[];

    export interface ServerOptions {
      host?: string;
      port?: number;
      backlog?: number;
      server?: http.Server;
      verifyClient?: VerifyClientCallbackAsync | VerifyClientCallbackSync;
      handleProtocols?: (
        protocols: string[],
        request: http.IncomingMessage,
      ) => string | false;
      path?: string;
      noServer?: boolean;
      clientTracking?: boolean;
      perMessageDeflate?: boolean | PerMessageDeflateOptions;
      maxPayload?: number;
    }

    export type VerifyClientCallbackAsync = (
      info: { origin: string; secure: boolean; req: http.IncomingMessage },
      callback: (res: boolean, code?: number, message?: string) => void,
    ) => void;

    export type VerifyClientCallbackSync = (info: {
      origin: string;
      secure: boolean;
      req: http.IncomingMessage;
    }) => boolean;

    export interface AddressInfo {
      address: string;
      family: string;
      port: number;
    }
  }

  export = WebSocket;
}

// Add missing https module reference
declare module "https" {
  import * as http from "http";

  export interface Server extends http.Server {}
}
