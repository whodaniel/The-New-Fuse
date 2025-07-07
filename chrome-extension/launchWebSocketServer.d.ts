// chrome-extension/launchWebSocketServer.d.ts
declare module './launchWebSocketServer.js' {
  export interface ServerProcess {
    process: {
      pid: number;
    };
    stop(): void;
    waitForReady(): Promise<void>;
  }

  export interface LaunchOptions {
    redisEnv: 'development' | 'production' | 'custom';
    customRedisConfig?: {
      host: string;
      port: number;
      username?: string;
      password?: string;
      tls?: boolean;
    };
  }

  export default function launchWebSocketServer(options: LaunchOptions): ServerProcess;
}