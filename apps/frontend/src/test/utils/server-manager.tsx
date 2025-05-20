import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';
import { logger } from './logger.js';

export class ServerManager {
  private static instance: ServerManager;
  private server?: ChildProcess;
  private port: number;

  private constructor(port: number = 5173) {
    this.port = port;
  }

  static getInstance(port?: number): ServerManager {
    if (!ServerManager.instance) {
      ServerManager.instance = new ServerManager(port);
    }
    return ServerManager.instance;
  }

  async start(): Promise<void> {
    await this.killExistingProcess();
    await this.startServer();
    await this.waitForServer();
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.kill('SIGTERM');
      await this.killExistingProcess();
      this.server = undefined;
    }
  }

  private async killExistingProcess(): Promise<void> {
    try {
      await new Promise<void>((resolve) => {
        const kill = spawn('kill', [`$(lsof -t -i:${this.port})`], { shell: true });
        kill.on('close', () => resolve());
      });
    } catch (error) {
      logger.info(`No process running on port ${this.port}`);
    }
  }

  private async startServer(): Promise<void> {
    this.server = spawn('yarn', ['dev'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PORT: this.port.toString() }
    });

    this.server.on('error', (error) => {
      logger.error('Server failed to start:', error);
    });
  }

  private async waitForServer(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    const serverUrl = `http://localhost:${this.port}`;

    return new Promise((resolve, reject) => {
      const checkServer = (): any => {
        http.get(serverUrl, (res) => {
          if (res.statusCode === 200) {
            logger.info('Server started successfully');
            resolve();
          } else {
            retry();
          }
        }).on('error', retry);
      };

      const retry = (): any => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Server not ready after ${timeout}ms`));
        } else {
          setTimeout(checkServer, 1000);
        }
      };

      checkServer();
    });
  }
}