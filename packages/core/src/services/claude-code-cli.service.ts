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
  private isAvailable: boolean = false;

  constructor(options: ClaudeCodeCLIOptions = {}) {
    super();
    this.options = {
      command: 'claude',
      timeout: 120000, // 2 minutes
      workingDirectory: process.cwd(),
      ...options
    };
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      const process = spawn('which', ['claude'], { 
        stdio: 'pipe',
        shell: true 
      });

      process.on('exit', (code) => {
        this.isAvailable = code === 0;
        this.emit('availability-checked', this.isAvailable);
      });

      process.on('error', () => {
        this.isAvailable = false;
        this.emit('availability-checked', false);
      });
    } catch (error) {
      this.isAvailable = false;
      this.emit('availability-checked', false);
    }
  }

  public async sendMessage(message: ClaudeCodeCLIMessage): Promise<ClaudeCodeCLIResponse> {
    if (!this.isAvailable) {
      throw new Error('Claude Code CLI is not available. Please ensure it is installed and accessible.');
    }

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      // Construct the claude command with the prompt
      const args = [];
      
      // Add prompt as stdin input
      const prompt = message.context 
        ? `${message.context}\n\nUser: ${message.prompt}` 
        : message.prompt;

      const claudeProcess = spawn(this.options.command!, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: this.options.workingDirectory,
        shell: true
      });

      // Set timeout
      const timeout = setTimeout(() => {
        claudeProcess.kill('SIGTERM');
        reject(new Error('Claude Code CLI request timed out'));
      }, this.options.timeout);

      // Send prompt to stdin
      claudeProcess.stdin?.write(prompt);
      claudeProcess.stdin?.end();

      // Collect stdout
      claudeProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // Collect stderr
      claudeProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      // Handle process completion
      claudeProcess.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          resolve({
            content: output.trim(),
            metadata: {
              exitCode: code,
              stderr: errorOutput
            }
          });
        } else {
          reject(new Error(`Claude Code CLI exited with code ${code}: ${errorOutput}`));
        }
      });

      // Handle process errors
      claudeProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to spawn Claude Code CLI: ${error.message}`));
      });
    });
  }

  public async isClaudeCodeAvailable(): Promise<boolean> {
    return this.isAvailable;
  }

  public async getVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.options.command!, ['--version'], {
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error('Failed to get Claude Code CLI version'));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}