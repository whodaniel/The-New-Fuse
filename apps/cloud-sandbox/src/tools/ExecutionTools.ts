/**
 * Code and Command Execution Tools
 *
 * Wrapped execution tools for running commands and code.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolRegistry, ToolWrapper } from './ToolWrapper.js';

const execAsync = promisify(exec);

/**
 * Register all execution tools
 */
export function registerExecutionTools(registry: ToolRegistry): void {
  // Run Shell Command
  registry.register(
    new ToolWrapper(
      {
        name: 'run_command',
        description: 'Execute a shell command in the sandbox environment',
        category: 'execution',
        riskLevel: 'critical',
        timeout: 60000, // 1 minute
        retryable: false,
        parameters: [
          {
            name: 'command',
            type: 'string',
            description: 'The shell command to execute',
            required: true,
            validation: (value) => {
              if (typeof value !== 'string') return false;
              // Must not be empty
              return value.trim().length > 0;
            },
            sanitize: (value) => {
              // Trim whitespace
              return (value as string).trim();
            },
          },
          {
            name: 'cwd',
            type: 'string',
            description: 'Working directory for command execution',
            required: false,
            default: process.cwd(),
          },
          {
            name: 'timeout',
            type: 'number',
            description: 'Command timeout in milliseconds',
            required: false,
            default: 30000,
            validation: (value) => {
              return typeof value === 'number' && value > 0 && value <= 60000;
            },
          },
        ],
        returns: {
          type: 'object',
          description: 'Command execution result with stdout and stderr',
        },
        examples: [
          {
            description: 'List files in current directory',
            params: { command: 'ls -la' },
            expectedResult: {
              success: true,
              stdout: '...',
              stderr: '',
              exitCode: 0,
            },
          },
          {
            description: 'Check Node.js version',
            params: { command: 'node --version' },
            expectedResult: {
              success: true,
              stdout: 'v18.0.0\n',
              stderr: '',
              exitCode: 0,
            },
          },
        ],
      },
      async (params) => {
        const command = params.command as string;
        const cwd = params.cwd as string;
        const timeout = params.timeout as number;

        try {
          const { stdout, stderr } = await execAsync(command, {
            cwd,
            timeout,
            maxBuffer: 1024 * 1024, // 1MB max output
          });

          return {
            success: true,
            stdout,
            stderr,
            exitCode: 0,
            command,
          };
        } catch (error: any) {
          return {
            success: false,
            stdout: error.stdout || '',
            stderr: error.stderr || error.message,
            exitCode: error.code || 1,
            command,
          };
        }
      }
    )
  );

  // Run Node.js Code
  registry.register(
    new ToolWrapper(
      {
        name: 'run_node_code',
        description: 'Execute Node.js JavaScript code',
        category: 'execution',
        riskLevel: 'high',
        timeout: 30000,
        retryable: false,
        parameters: [
          {
            name: 'code',
            type: 'string',
            description: 'JavaScript code to execute',
            required: true,
          },
          {
            name: 'timeout',
            type: 'number',
            description: 'Execution timeout in milliseconds',
            required: false,
            default: 10000,
          },
        ],
        returns: {
          type: 'object',
          description: 'Code execution result',
        },
      },
      async (params) => {
        const code = params.code as string;
        const timeout = params.timeout as number;

        // Create temporary file with code
        const tempFile = `/tmp/exec_${Date.now()}.js`;
        const fs = require('fs').promises;
        await fs.writeFile(tempFile, code);

        try {
          const { stdout, stderr } = await execAsync(`node ${tempFile}`, {
            timeout,
            maxBuffer: 512 * 1024, // 512KB max output
          });

          return {
            success: true,
            stdout,
            stderr,
            exitCode: 0,
          };
        } catch (error: any) {
          return {
            success: false,
            stdout: error.stdout || '',
            stderr: error.stderr || error.message,
            exitCode: error.code || 1,
          };
        } finally {
          // Clean up temp file
          try {
            await fs.unlink(tempFile);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    )
  );

  // Run Python Code
  registry.register(
    new ToolWrapper(
      {
        name: 'run_python_code',
        description: 'Execute Python code',
        category: 'execution',
        riskLevel: 'high',
        timeout: 30000,
        retryable: false,
        parameters: [
          {
            name: 'code',
            type: 'string',
            description: 'Python code to execute',
            required: true,
          },
          {
            name: 'timeout',
            type: 'number',
            description: 'Execution timeout in milliseconds',
            required: false,
            default: 10000,
          },
        ],
        returns: {
          type: 'object',
          description: 'Code execution result',
        },
      },
      async (params) => {
        const code = params.code as string;
        const timeout = params.timeout as number;

        // Create temporary file with code
        const tempFile = `/tmp/exec_${Date.now()}.py`;
        const fs = require('fs').promises;
        await fs.writeFile(tempFile, code);

        try {
          const { stdout, stderr } = await execAsync(`python3 ${tempFile}`, {
            timeout,
            maxBuffer: 512 * 1024,
          });

          return {
            success: true,
            stdout,
            stderr,
            exitCode: 0,
          };
        } catch (error: any) {
          return {
            success: false,
            stdout: error.stdout || '',
            stderr: error.stderr || error.message,
            exitCode: error.code || 1,
          };
        } finally {
          // Clean up temp file
          try {
            await fs.unlink(tempFile);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    )
  );

  // Get Environment Info
  registry.register(
    new ToolWrapper(
      {
        name: 'get_env_info',
        description: 'Get information about the sandbox environment',
        category: 'system',
        riskLevel: 'medium',
        timeout: 5000,
        retryable: true,
        parameters: [],
        returns: {
          type: 'object',
          description: 'Environment information',
        },
      },
      async () => {
        const os = require('os');

        return {
          success: true,
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          cwd: process.cwd(),
          uptime: process.uptime(),
          memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem(),
          },
          cpu: {
            model: os.cpus()[0]?.model || 'Unknown',
            cores: os.cpus().length,
          },
        };
      }
    )
  );

  // Ping (health check)
  registry.register(
    new ToolWrapper(
      {
        name: 'ping',
        description: 'Health check endpoint',
        category: 'monitoring',
        riskLevel: 'low',
        timeout: 1000,
        retryable: true,
        parameters: [],
        returns: {
          type: 'object',
          description: 'Pong response with timestamp',
        },
      },
      async () => {
        return {
          success: true,
          message: 'pong',
          timestamp: new Date().toISOString(),
        };
      }
    )
  );
}
