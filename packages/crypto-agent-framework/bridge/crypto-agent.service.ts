/**
 * TypeScript Bridge for 4-Layer Crypto AI Agent Framework
 *
 * This service provides a TypeScript/NestJS interface to the Python-based
 * crypto agent framework, enabling integration with The New Fuse backend.
 *
 * Integration Methods:
 * 1. HTTP API: Call Python service via REST API
 * 2. Child Process: Spawn Python process and communicate via stdio
 * 3. Socket: Connect to running Python agent via WebSocket/Socket.IO
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import { isValidPublicUrl } from '../../utils/src/validators.server';

export interface CryptoAgentTask {
  prompt: string;
  priority?: number;
  requester?: string;
}

export interface CryptoAgentResult {
  task_id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  agent_id: string;
}

export interface CryptoAgentStatus {
  agent_id: string;
  queue_length: number;
  current_task?: string;
  total_completed: number;
  state: any;
}

enum IntegrationMode {
  HTTP_API = 'http_api',
  CHILD_PROCESS = 'child_process',
  SOCKET = 'socket',
}

@Injectable()
export class CryptoAgentService implements OnModuleInit {
  private readonly logger = new Logger(CryptoAgentService.name);
  private readonly mode: IntegrationMode;
  private pythonProcess: ChildProcess | null = null;
  private apiClient: AxiosInstance | null = null;
  private eventEmitter: EventEmitter = new EventEmitter();

  constructor() {
    // Determine integration mode from environment
    this.mode = (process.env.CRYPTO_AGENT_MODE as IntegrationMode) || IntegrationMode.HTTP_API;

    this.logger.log(`Initializing Crypto Agent Bridge (mode: ${this.mode})`);
  }

  async onModuleInit() {
    await this.initialize();
  }

  /**
   * Initialize the bridge based on integration mode
   */
  private async initialize(): Promise<void> {
    switch (this.mode) {
      case IntegrationMode.HTTP_API:
        await this.initializeHttpApi();
        break;

      case IntegrationMode.CHILD_PROCESS:
        await this.initializeChildProcess();
        break;

      case IntegrationMode.SOCKET:
        await this.initializeSocket();
        break;
    }
  }

  /**
   * Initialize HTTP API mode
   */
  private async initializeHttpApi(): Promise<void> {
    const apiUrl = process.env.CRYPTO_AGENT_API_URL || 'http://localhost:8000';

    const validationResult = await isValidPublicUrl(apiUrl);
    if (!validationResult.valid) {
      this.logger.error(`Invalid CRYPTO_AGENT_API_URL: ${validationResult.reason}`);
      throw new Error(`Invalid CRYPTO_AGENT_API_URL: ${validationResult.reason}`);
    }

    this.apiClient = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.CRYPTO_AGENT_API_KEY || '',
      },
    });

    // Test connection
    try {
      const response = await this.apiClient.get('/health');
      this.logger.log(`Connected to Crypto Agent API: ${apiUrl}`);
      this.logger.log(`Agent Status: ${response.data.status}`);
    } catch (error) {
      this.logger.warn(`Could not connect to Crypto Agent API: ${error.message}`);
      this.logger.warn(`Make sure the Python service is running on ${apiUrl}`);
    }
  }

  /**
   * Initialize child process mode
   */
  private async initializeChildProcess(): Promise<void> {
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const scriptPath = path.join(__dirname, '../../main.py');

    this.logger.log(`Spawning Python crypto agent: ${pythonPath} ${scriptPath}`);

    this.pythonProcess = spawn(pythonPath, [scriptPath, '--loop'], {
      cwd: path.join(__dirname, '../..'),
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
      },
    });

    // Handle stdout
    this.pythonProcess.stdout?.on('data', (data) => {
      const message = data.toString().trim();
      this.logger.debug(`[Python Agent] ${message}`);
      this.eventEmitter.emit('log', message);
    });

    // Handle stderr
    this.pythonProcess.stderr?.on('data', (data) => {
      const error = data.toString().trim();
      this.logger.error(`[Python Agent Error] ${error}`);
      this.eventEmitter.emit('error', error);
    });

    // Handle exit
    this.pythonProcess.on('exit', (code) => {
      this.logger.warn(`Python agent exited with code ${code}`);
      this.eventEmitter.emit('exit', code);
    });

    this.logger.log('Python crypto agent started successfully');
  }

  /**
   * Initialize socket mode (not implemented)
   */
  private async initializeSocket(): Promise<void> {
    this.logger.warn('Socket mode not yet implemented');
    // TODO: Implement WebSocket/Socket.IO connection
  }

  /**
   * Submit a task to the crypto agent
   */
  async submitTask(task: CryptoAgentTask): Promise<CryptoAgentResult> {
    this.logger.log(`Submitting task: ${task.prompt.substring(0, 50)}...`);

    switch (this.mode) {
      case IntegrationMode.HTTP_API:
        return await this.submitTaskHttp(task);

      case IntegrationMode.CHILD_PROCESS:
        return await this.submitTaskProcess(task);

      default:
        throw new Error(`Task submission not supported in ${this.mode} mode`);
    }
  }

  /**
   * Submit task via HTTP API
   */
  private async submitTaskHttp(task: CryptoAgentTask): Promise<CryptoAgentResult> {
    try {
      const response = await this.apiClient!.post('/tasks', task);
      return response.data;
    } catch (error) {
      this.logger.error(`Error submitting task: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit task via child process (simplified)
   */
  private async submitTaskProcess(task: CryptoAgentTask): Promise<CryptoAgentResult> {
    // For child process mode, we'd need to implement IPC
    // This is a simplified version
    return {
      task_id: `task_${Date.now()}`,
      status: 'queued',
      result: { message: 'Task queued (child process mode)' },
      agent_id: 'crypto-agent-001',
    };
  }

  /**
   * Get agent status
   */
  async getStatus(): Promise<CryptoAgentStatus> {
    switch (this.mode) {
      case IntegrationMode.HTTP_API:
        const response = await this.apiClient!.get('/status');
        return response.data;

      default:
        return {
          agent_id: 'crypto-agent-001',
          queue_length: 0,
          total_completed: 0,
          state: {},
        };
    }
  }

  /**
   * Get task result
   */
  async getTaskResult(taskId: string): Promise<CryptoAgentResult | null> {
    try {
      const response = await this.apiClient!.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * High-level convenience methods
   */

  async generateAndMintNFT(
    description: string,
    chain: string = 'base',
    listingPrice: string = '100 USDC'
  ): Promise<CryptoAgentResult> {
    const prompt = `Generate a 3D model of '${description}', mint it as an NFT on ${chain}, and list it for ${listingPrice}`;
    return await this.submitTask({ prompt });
  }

  async swapTokens(amount: number, fromToken: string, toToken: string): Promise<CryptoAgentResult> {
    const prompt = `Swap ${amount} ${fromToken} for ${toToken}`;
    return await this.submitTask({ prompt });
  }

  async stakeForYield(amount: number, token: string): Promise<CryptoAgentResult> {
    const prompt = `Stake ${amount} ${token} in the highest-yield pool`;
    return await this.submitTask({ prompt });
  }

  async bridgeTokens(
    amount: number,
    token: string,
    fromChain: string,
    toChain: string
  ): Promise<CryptoAgentResult> {
    const prompt = `Bridge ${amount} ${token} from ${fromChain} to ${toChain}`;
    return await this.submitTask({ prompt });
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pythonProcess) {
      this.logger.log('Terminating Python crypto agent...');
      this.pythonProcess.kill();
    }
  }
}
