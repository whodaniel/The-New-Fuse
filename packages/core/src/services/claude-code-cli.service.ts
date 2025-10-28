import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface ClaudeCodeCLIOptions {
  command?: string;
  timeout?: number;
  workingDirectory?: string;
}

export interface ClaudeCodeCLIMessage {
  prompt: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ClaudeCodeCLIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  metadata?: Record<string, any>;
}

export class ClaudeCodeCLIService extends EventEmitter {
  private options: ClaudeCodeCLIOptions;
  private _isAvailable: boolean = false;

  constructor(options: ClaudeCodeCLIOptions = {}) {
    super();
    this.options = {
      command: 'claude',
      timeout: 120000, // 2 minutes
      workingDirectory: process.cwd(),
      ...options,
    };
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      const process = spawn('which', [this.options.command], {
        stdio: 'pipe',
        shell: true,
      });
      process.on('exit', (code) => {
        this._isAvailable = code === 0;
        this.emit('availability-checked', this._isAvailable);
      });
      process.on('error', () => {
        this._isAvailable = false;
        this.emit('availability-checked', false);
      });
    } catch (error) {
      this._isAvailable = false;
      this.emit('availability-checked', false);
    }
  }

  public get isAvailable(): boolean {
    return this._isAvailable;
  }

  public async sendMessage(message: ClaudeCodeCLIMessage): Promise<ClaudeCodeCLIResponse> {
    if (!this._isAvailable) {
      throw new Error('Claude Code CLI is not available. Please ensure it is installed and accessible.');
    }

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';
      const args = [];
      const prompt = message.context ? `${message.context}\n\nUser: ${message.prompt}` : message.prompt;
      const claudeProcess = spawn(this.options.command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: this.options.workingDirectory,
        shell: true,
      });

      const timeout = setTimeout(() => {
        claudeProcess.kill('SIGTERM');
        reject(new Error('Claude Code CLI command timed out.'));
      }, this.options.timeout);

      claudeProcess.stdin.write(prompt);
      claudeProcess.stdin.end();

      claudeProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      claudeProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      claudeProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          try {
            const response = JSON.parse(output) as ClaudeCodeCLIResponse;
            resolve(response);
          } catch (e) {
            reject(new Error('Failed to parse Claude Code CLI response.'));
          }
        } else {
          reject(new Error(`Claude Code CLI exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  public async getVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.options.command, ['--version'], {
        stdio: 'pipe',
        shell: true,
      });
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error('Failed to get Claude Code CLI version.'));
        }
      });
      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}
