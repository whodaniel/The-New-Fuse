import { spawn, ChildProcess } from 'child_process';
import { Logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

/**
 * Configuration for the EnhancedPythonBridge
 */
export interface EnhancedPythonBridgeConfig {
  /**
   * Path to the Python script to execute
   */
  pythonPath: string;
  
  /**
   * Timeout for method invocations in milliseconds
   * @default 30000
   */
  timeout?: number;
  
  /**
   * Python executable to use
   * @default 'python'
   */
  pythonExecutable?: string;
  
  /**
   * Additional arguments to pass to the Python executable
   */
  pythonArgs?: string[];
  
  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
  
  /**
   * Maximum number of retry attempts for failed invocations
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Delay between retry attempts in milliseconds
   * @default 1000
   */
  retryDelay?: number;
}

/**
 * Enhanced Python Bridge for ADK Integration
 * 
 * This bridge provides a robust interface for communicating with Python scripts,
 * particularly those using Google's ADK (Agent Development Kit).
 */
export class EnhancedPythonBridge extends EventEmitter {
  private process: ChildProcess | null = null;
  private config: Required<EnhancedPythonBridgeConfig>;
  private logger: Logger;
  private isInitialized = false;
  private pendingRequests = new Map<string, { resolve: Function, reject: Function, timeout: NodeJS.Timeout }>();
  private requestCounter = 0;

  /**
   * Create a new EnhancedPythonBridge
   * @param config Configuration options
   */
  constructor(config: EnhancedPythonBridgeConfig) {
    super();
    this.config = {
      timeout: 30000,
      pythonExecutable: 'python',
      pythonArgs: [],
      debug: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
    this.logger = new Logger('EnhancedPythonBridge');
  }

  /**
   * Initialize the Python bridge
   * @returns Promise that resolves when the bridge is initialized
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug('Bridge already initialized');
      return;
    }

    try {
      const args = [...this.config.pythonArgs, this.config.pythonPath];
      this.logger.debug(`Spawning Python process: ${this.config.pythonExecutable} ${args.join(' ')}`);
      
      this.process = spawn(this.config.pythonExecutable, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Set up error handling
      this.process.on('error', (err: Error) => {
        this.logger.error(`Python process error: ${err.message}`);
        this.emit('error', err);
      });

      this.process.on('exit', (code: number, signal: string) => {
        this.logger.debug(`Python process exited with code ${code} and signal ${signal}`);
        this.isInitialized = false;
        this.emit('exit', { code, signal });
      });

      // Set up stdout handling
      let buffer = '';
      this.process.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        buffer += text;
        
        try {
          // Try to parse complete JSON objects from the buffer
          let jsonEndIndex;
          while ((jsonEndIndex = this.findJsonEnd(buffer)) !== -1) {
            const jsonStr = buffer.substring(0, jsonEndIndex + 1);
            buffer = buffer.substring(jsonEndIndex + 1);
            
            const response = JSON.parse(jsonStr);
            this.handleResponse(response);
          }
        } catch (error) {
          // If we can't parse the JSON, just wait for more data
          if (this.config.debug) {
            this.logger.debug(`Incomplete JSON: ${buffer}`);
          }
        }
      });

      // Set up stderr handling
      this.process.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        this.logger.error(`Python stderr: ${text}`);
        this.emit('stderr', text);
      });

      // Wait for the process to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for Python process to initialize'));
        }, this.config.timeout);

        this.invoke('initialize', {})
          .then(() => {
            clearTimeout(timeout);
            this.isInitialized = true;
            this.logger.debug('Python bridge initialized successfully');
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeout);
            this.logger.error(`Failed to initialize Python bridge: ${error.message}`);
            reject(error);
          });
      });
    } catch (error) {
      this.logger.error(`Failed to spawn Python process: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Invoke a method on the Python script
   * @param method Method name to invoke
   * @param args Arguments to pass to the method
   * @param retryCount Current retry count (used internally)
   * @returns Promise that resolves with the result of the method
   */
  async invoke(method: string, args: Record<string, any>, retryCount = 0): Promise<any> {
    if (!this.isInitialized && method !== 'initialize') {
      await this.initialize();
    }

    if (!this.process || this.process.killed) {
      throw new Error('Python process is not running');
    }

    return new Promise((resolve, reject) => {
      try {
        const requestId = `req_${Date.now()}_${this.requestCounter++}`;
        const request = { id: requestId, method, args };
        
        // Set up timeout
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(requestId);
          
          if (retryCount < this.config.maxRetries) {
            this.logger.warn(`Request ${requestId} timed out, retrying (${retryCount + 1}/${this.config.maxRetries})`);
            setTimeout(() => {
              this.invoke(method, args, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, this.config.retryDelay);
          } else {
            reject(new Error(`Python bridge timeout after ${this.config.maxRetries} retries`));
          }
        }, this.config.timeout);

        // Store the pending request
        this.pendingRequests.set(requestId, { resolve, reject, timeout });
        
        // Send the request
        if (this.config.debug) {
          this.logger.debug(`Sending request: ${JSON.stringify(request)}`);
        }
        
        this.process.stdin?.write(JSON.stringify(request) + '\n');
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle a response from the Python script
   * @param response Response object
   */
  private handleResponse(response: any): void {
    if (!response.id) {
      this.logger.warn(`Received response without ID: ${JSON.stringify(response)}`);
      return;
    }

    const pendingRequest = this.pendingRequests.get(response.id);
    if (!pendingRequest) {
      this.logger.warn(`Received response for unknown request: ${response.id}`);
      return;
    }

    // Clear the timeout and remove the pending request
    clearTimeout(pendingRequest.timeout);
    this.pendingRequests.delete(response.id);

    if (response.error) {
      pendingRequest.reject(new Error(response.error));
    } else {
      pendingRequest.resolve(response.result);
    }
  }

  /**
   * Find the end index of a complete JSON object in a string
   * @param str String to search
   * @returns Index of the end of the JSON object, or -1 if no complete object is found
   */
  private findJsonEnd(str: string): number {
    let braceCount = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (inString) {
        if (char === '\\' && !escaped) {
          escaped = true;
        } else if (char === '"' && !escaped) {
          inString = false;
        } else {
          escaped = false;
        }
      } else if (char === '"') {
        inString = true;
      } else if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i;
        }
      }
    }

    return -1;
  }

  /**
   * Terminate the Python process
   * @returns Promise that resolves when the process is terminated
   */
  async terminate(): Promise<void> {
    if (!this.process) {
      return;
    }

    return new Promise<void>((resolve) => {
      // Cancel all pending requests
      for (const [id, request] of this.pendingRequests.entries()) {
        clearTimeout(request.timeout);
        request.reject(new Error('Python bridge terminated'));
        this.pendingRequests.delete(id);
      }

      // If the process is already dead, just resolve
      if (this.process.killed) {
        this.isInitialized = false;
        resolve();
        return;
      }

      // Set up a listener for the exit event
      this.process.once('exit', () => {
        this.isInitialized = false;
        resolve();
      });

      // Try to gracefully terminate the process
      try {
        this.invoke('terminate', {})
          .catch(() => {
            // Ignore errors during termination
          })
          .finally(() => {
            // Kill the process after a short delay
            setTimeout(() => {
              if (this.process && !this.process.killed) {
                this.process.kill();
              }
            }, 500);
          });
      } catch (error) {
        // If we can't invoke the terminate method, just kill the process
        if (this.process && !this.process.killed) {
          this.process.kill();
        }
      }
    });
  }
}
