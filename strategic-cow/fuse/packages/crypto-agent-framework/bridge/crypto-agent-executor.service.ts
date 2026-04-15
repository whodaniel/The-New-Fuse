/**
 * Crypto Agent Executor Service
 *
 * TypeScript/NestJS service for invoking crypto agents through the Python executor.
 * This provides a clean interface for calling crypto operations from the TNF backend.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as net from 'net';

// ===== Types =====

export interface CryptoAgentTask {
  agent_name: string;
  input_data: Record<string, any>;
}

export interface CryptoAgentResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  execution_time_ms?: number;
}

export interface ExecutorConfig {
  mode: 'socket' | 'http' | 'process';
  socket_path?: string;
  http_url?: string;
  python_path?: string;
  executor_path?: string;
}

// ===== Agent Input Type Definitions =====

export interface EnsoDeFiInput {
  operation_type: 'swap' | 'stake' | 'bridge' | 'withdraw' | 'compound';
  token_in: string;
  amount: string;
  token_out?: string;
  chain_from?: string;
  chain_to?: string;
  strategy?: 'highest_yield' | 'lowest_risk' | 'balanced';
  slippage_tolerance?: number;
  gas_priority?: 'low' | 'medium' | 'high';
}

export interface TokenSwapInput {
  from_token: string;
  to_token: string;
  amount: string;
  min_output?: string;
  slippage_tolerance?: number;
}

export interface RenderJobInput {
  job_type: '3d_generation' | 'image_generation' | 'video_render' | 'vfx_composite';
  prompt?: string;
  scene_file_url?: string;
  engine?: 'StabilityAI' | 'Blender' | 'Houdini' | 'Unreal' | 'Custom';
  output_format: 'png' | 'jpg' | 'glb' | 'gltf' | 'fbx' | 'mp4' | 'exr';
  resolution?: string;
  quality?: 'draft' | 'medium' | 'high' | 'production';
  samples?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AkashDeploymentInput {
  deployment_type: 'ai_training' | 'model_inference' | 'api_service' | 'agent_runtime' | 'custom';
  docker_image: string;
  command?: string[];
  environment_variables?: Record<string, string>;
  cpu_cores: number;
  memory_gb: number;
  storage_gb?: number;
  gpu_model?: 'NVIDIA_A100' | 'NVIDIA_V100' | 'NVIDIA_B200' | 'AMD_MI250';
  gpu_count?: number;
  expose_ports?: number[];
  requires_public_ip?: boolean;
  region_preference?: string[];
  max_bid_price_uakt?: number;
  auto_renewal?: boolean;
  duration_hours?: number;
}

export interface ArweaveStorageInput {
  data_type: 'audit_log' | 'agent_state' | 'nft_metadata' | 'document' | 'binary';
  content: string;
  tags?: Record<string, string>;
  content_type?: string;
  encrypt?: boolean;
}

export interface AuditLogEntry {
  event_type: string;
  event_data: Record<string, any>;
  actor: string;
  timestamp?: Date;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  tags?: Record<string, string>;
}

// ===== Main Service =====

@Injectable()
export class CryptoAgentExecutorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CryptoAgentExecutorService.name);
  private config: ExecutorConfig;
  private pythonProcess?: ChildProcess;
  private socketClient?: net.Socket;
  private requestCounter = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: CryptoAgentResult) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor() {
    // Default configuration
    this.config = {
      mode: 'socket',
      socket_path: '/tmp/crypto-agent-executor.sock',
      python_path: 'python3',
      executor_path: path.join(__dirname, '../../executor/crypto_agent_executor.py'),
    };
  }

  async onModuleInit() {
    this.logger.log('Initializing Crypto Agent Executor Service...');

    if (this.config.mode === 'socket') {
      await this.initializeSocketMode();
    } else if (this.config.mode === 'process') {
      await this.initializeProcessMode();
    }

    this.logger.log(`Crypto Agent Executor Service initialized in ${this.config.mode} mode`);
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Crypto Agent Executor Service...');

    if (this.socketClient) {
      this.socketClient.destroy();
    }

    if (this.pythonProcess) {
      this.pythonProcess.kill();
    }
  }

  // ===== Initialization Methods =====

  private async initializeSocketMode(): Promise<void> {
    // Start Python executor in socket server mode
    this.pythonProcess = spawn(this.config.python_path!, [
      this.config.executor_path!,
      '--mode', 'socket',
      '--socket-path', this.config.socket_path!,
    ]);

    this.pythonProcess.on('error', (error) => {
      this.logger.error(`Python process error: ${error.message}`);
    });

    this.pythonProcess.on('exit', (code) => {
      this.logger.warn(`Python process exited with code ${code}`);
    });

    // Wait for socket file to be created
    await this.waitForSocket();

    // Connect to socket
    this.socketClient = net.connect(this.config.socket_path!);

    this.socketClient.on('data', (data) => {
      this.handleSocketResponse(data);
    });

    this.socketClient.on('error', (error) => {
      this.logger.error(`Socket error: ${error.message}`);
    });
  }

  private async initializeProcessMode(): Promise<void> {
    // Process mode: spawn new Python process for each request
    this.logger.log('Process mode: will spawn Python process per request');
  }

  private async waitForSocket(): Promise<void> {
    const maxAttempts = 30;
    const delayMs = 100;

    for (let i = 0; i < maxAttempts; i++) {
      if (await this.checkSocketExists()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error('Timeout waiting for Python executor socket');
  }

  private async checkSocketExists(): Promise<boolean> {
    return new Promise((resolve) => {
      const testSocket = net.connect(this.config.socket_path!, () => {
        testSocket.destroy();
        resolve(true);
      });
      testSocket.on('error', () => resolve(false));
    });
  }

  // ===== Core Execution Method =====

  async executeAgent(agentName: string, inputData: Record<string, any>): Promise<CryptoAgentResult> {
    const startTime = Date.now();

    try {
      const task: CryptoAgentTask = {
        agent_name: agentName,
        input_data: inputData,
      };

      let result: any;

      if (this.config.mode === 'socket') {
        result = await this.executeViaSocket(task);
      } else if (this.config.mode === 'http') {
        result = await this.executeViaHttp(task);
      } else {
        result = await this.executeViaProcess(task);
      }

      const execution_time_ms = Date.now() - startTime;

      return {
        success: true,
        data: result,
        execution_time_ms,
      };
    } catch (error: any) {
      this.logger.error(`Agent execution failed: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
        execution_time_ms: Date.now() - startTime,
      };
    }
  }

  // ===== Execution Mode Implementations =====

  private async executeViaSocket(task: CryptoAgentTask): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = this.requestCounter++;
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, 30000); // 30 second timeout

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      const message = JSON.stringify({ request_id: requestId, ...task });
      this.socketClient!.write(message + '\n');
    });
  }

  private async executeViaHttp(task: CryptoAgentTask): Promise<any> {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${this.config.http_url}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeViaProcess(task: CryptoAgentTask): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.config.python_path!, [
        this.config.executor_path!,
        '--mode', 'stdio',
      ]);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error: any) {
            reject(new Error(`Failed to parse result: ${error.message}`));
          }
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
        }
      });

      // Send task via stdin
      process.stdin.write(JSON.stringify(task));
      process.stdin.end();
    });
  }

  private handleSocketResponse(data: Buffer): void {
    try {
      const response = JSON.parse(data.toString());
      const requestId = response.request_id;
      const pending = this.pendingRequests.get(requestId);

      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(requestId);

        if (response.error) {
          pending.reject(new Error(response.error));
        } else {
          pending.resolve(response.result);
        }
      }
    } catch (error: any) {
      this.logger.error(`Failed to handle socket response: ${error.message}`);
    }
  }

  // ===== Convenience Methods for Specific Agents =====

  /**
   * Execute a token swap via ENSO
   */
  async swapTokens(input: TokenSwapInput): Promise<CryptoAgentResult> {
    const ensoDeFiInput: EnsoDeFiInput = {
      operation_type: 'swap',
      token_in: input.from_token,
      token_out: input.to_token,
      amount: input.amount,
      slippage_tolerance: input.slippage_tolerance,
    };

    return this.executeAgent('enso-defi-agent', ensoDeFiInput);
  }

  /**
   * Stake tokens for yield via ENSO
   */
  async stakeForYield(
    token: string,
    amount: string,
    strategy: 'highest_yield' | 'lowest_risk' | 'balanced' = 'highest_yield'
  ): Promise<CryptoAgentResult> {
    const input: EnsoDeFiInput = {
      operation_type: 'stake',
      token_in: token,
      amount,
      strategy,
    };

    return this.executeAgent('enso-defi-agent', input);
  }

  /**
   * Bridge tokens across chains via ENSO
   */
  async bridgeTokens(
    token: string,
    amount: string,
    fromChain: string,
    toChain: string
  ): Promise<CryptoAgentResult> {
    const input: EnsoDeFiInput = {
      operation_type: 'bridge',
      token_in: token,
      amount,
      chain_from: fromChain,
      chain_to: toChain,
    };

    return this.executeAgent('enso-defi-agent', input);
  }

  /**
   * Generate a 3D model via Render Network
   */
  async generate3DModel(
    description: string,
    outputFormat: 'glb' | 'gltf' | 'fbx' | 'obj' = 'glb'
  ): Promise<CryptoAgentResult> {
    const input: RenderJobInput = {
      job_type: '3d_generation',
      prompt: description,
      output_format: outputFormat,
      quality: 'high',
    };

    return this.executeAgent('render-network-agent', input);
  }

  /**
   * Generate an AI image via Render Network
   */
  async generateImage(
    prompt: string,
    quality: 'draft' | 'medium' | 'high' | 'production' = 'high'
  ): Promise<CryptoAgentResult> {
    const input: RenderJobInput = {
      job_type: 'image_generation',
      prompt,
      output_format: 'png',
      quality,
    };

    return this.executeAgent('render-network-agent', input);
  }

  /**
   * Deploy a workload on Akash Network
   */
  async deployOnAkash(input: AkashDeploymentInput): Promise<CryptoAgentResult> {
    return this.executeAgent('akash-compute-agent', input);
  }

  /**
   * Store data permanently on Arweave
   */
  async storeOnArweave(input: ArweaveStorageInput): Promise<CryptoAgentResult> {
    return this.executeAgent('arweave-memory-agent', input);
  }

  /**
   * Log an audit entry to Arweave
   */
  async logAuditEntry(input: AuditLogEntry): Promise<CryptoAgentResult> {
    return this.executeAgent('arweave-memory-agent', input);
  }

  // ===== Health Check =====

  async healthCheck(): Promise<boolean> {
    try {
      // Attempt a simple operation
      const result = await this.executeAgent('arweave-memory-agent', {
        query_type: 'by_tag',
        filters: { test: 'health_check' },
        limit: 1,
      });

      return result.success;
    } catch (error) {
      return false;
    }
  }
}
