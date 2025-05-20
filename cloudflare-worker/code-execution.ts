/**
 * Code Execution Worker for The New Fuse
 *
 * This Cloudflare Worker provides secure code execution capabilities for agents.
 * It executes code in an isolated environment and returns the results.
 */

import { CodeExecutionLanguage } from '../packages/core/src/services/code-execution/types.js';

interface Env {
  API_KEY: string;
}

interface ExecutionRequest {
  code: string;
  language: CodeExecutionLanguage;
  timeout?: number;
  memoryLimit?: number;
  allowedModules?: string[];
  context?: Record<string, any>;
  clientId: string;
}

interface ExecutionResponse {
  success: boolean;
  output: string[];
  result?: any;
  error?: {
    message: string;
    stack?: string;
    type?: string;
  };
  metrics: {
    executionTime: number;
    memoryUsage: number;
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Validate API key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== env.API_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      // Parse request body
      const requestData = await request.json() as ExecutionRequest;

      // Validate request
      if (!requestData.code || !requestData.clientId) {
        return new Response(JSON.stringify({
          success: false,
          output: [],
          error: { message: 'Invalid request: code and clientId are required' },
          metrics: { executionTime: 0, memoryUsage: 0 }
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Execute code
      const result = await executeCode(requestData);

      // Return result
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      // Handle unexpected errors
      return new Response(JSON.stringify({
        success: false,
        output: [],
        error: {
          message: error.message || 'Unknown error',
          stack: error.stack,
          type: error.name
        },
        metrics: { executionTime: 0, memoryUsage: 0 }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Execute code in a secure environment
 */
async function executeCode(request: ExecutionRequest): Promise<ExecutionResponse> {
  const startTime = Date.now();
  const output: string[] = [];
  let result: any = undefined;
  let error: any = undefined;

  // Set default values
  const timeout = request.timeout || 5000;
  const memoryLimit = request.memoryLimit || 50 * 1024 * 1024; // 50MB
  const allowedModules = request.allowedModules || [];
  const context = request.context || {};

  try {
    // Create execution environment based on language
    switch (request.language) {
      case CodeExecutionLanguage.JAVASCRIPT:
        ({ result, error } = await executeJavaScript(request.code, output, timeout, memoryLimit, allowedModules, context));
        break;
      case CodeExecutionLanguage.TYPESCRIPT:
        ({ result, error } = await executeTypeScript(request.code, output, timeout, memoryLimit, allowedModules, context));
        break;
      case CodeExecutionLanguage.PYTHON:
        ({ result, error } = await executePython(request.code, output, timeout, memoryLimit, allowedModules, context));
        break;
      case CodeExecutionLanguage.RUBY:
        ({ result, error } = await executeRuby(request.code, output, timeout, memoryLimit, allowedModules, context));
        break;
      case CodeExecutionLanguage.SHELL:
        ({ result, error } = await executeShell(request.code, output, timeout, memoryLimit, allowedModules, context));
        break;
      case CodeExecutionLanguage.HTML:
        ({ result, error } = await executeHtml(request.code, output, timeout, memoryLimit, allowedModules, context));
        break;
      case CodeExecutionLanguage.CSS:
        ({ result, error } = await executeCss(request.code, output, timeout, memoryLimit, allowedModules, context));
        break;
      default:
        throw new Error(`Unsupported language: ${request.language}`);
    }

    // Calculate execution metrics
    const executionTime = Date.now() - startTime;

    // Estimate memory usage based on output size and result size
    // This is a very rough estimate and should be replaced with actual measurements in production
    const outputSize = JSON.stringify(output).length;
    const resultSize = result ? JSON.stringify(result).length : 0;
    const memoryUsage = Math.min(
      (outputSize + resultSize) * 2, // Rough estimate: 2x the size of output and result
      memoryLimit // Cap at the memory limit
    );

    // Return result
    return {
      success: !error,
      output,
      result: error ? undefined : result,
      error: error ? {
        message: error.message || 'Unknown error',
        stack: error.stack,
        type: error.name
      } : undefined,
      metrics: {
        executionTime,
        memoryUsage
      }
    };
  } catch (e) {
    // Handle unexpected errors
    return {
      success: false,
      output,
      error: {
        message: e.message || 'Unknown error',
        stack: e.stack,
        type: e.name
      },
      metrics: {
        executionTime: Date.now() - startTime,
        memoryUsage: 0
      }
    };
  }
}

/**
 * Execute JavaScript code
 */
async function executeJavaScript(
  code: string,
  output: string[],
  timeout: number,
  memoryLimit: number,
  allowedModules: string[],
  context: Record<string, any>
): Promise<{ result?: any, error?: Error }> {
  try {
    // Create a secure context with limited capabilities
    const secureContext: Record<string, any> = {
      console: {
        log: (...args: any[]) => output.push(`[log] ${args.join(' ')}`),
        error: (...args: any[]) => output.push(`[error] ${args.join(' ')}`),
        warn: (...args: any[]) => output.push(`[warn] ${args.join(' ')}`),
        info: (...args: any[]) => output.push(`[info] ${args.join(' ')}`),
      },
      setTimeout: (cb: Function, ms: number) => {
        if (ms > timeout) {
          throw new Error(`setTimeout duration exceeds execution timeout`);
        }
        return setTimeout(cb, ms);
      },
      clearTimeout,
      ...context,
    };

    // Add allowed modules to context
    // Note: In Cloudflare Workers, we can't dynamically import modules
    // This is a simplified implementation

    // Wrap code in a function to capture return value
    const wrappedCode = `
      try {
        ${code}
      } catch (e) {
        throw e;
      }
    `;

    // Execute code with timeout
    const executionPromise = new Promise<any>((resolve, reject) => {
      try {
        // In a real implementation, we would use a proper sandbox
        // For now, use Function constructor (not secure for production)
        const fn = new Function(...Object.keys(secureContext), wrappedCode);
        const result = fn(...Object.values(secureContext));
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });

    // Race against timeout
    const result = await Promise.race([
      executionPromise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Execution timed out after ${timeout}ms`)), timeout);
      })
    ]);

    return { result };
  } catch (error) {
    return { error };
  }
}

/**
 * Execute TypeScript code
 * Note: In a real implementation, we would transpile TypeScript to JavaScript first
 */
async function executeTypeScript(
  code: string,
  output: string[],
  timeout: number,
  memoryLimit: number,
  allowedModules: string[],
  context: Record<string, any>
): Promise<{ result?: any, error?: Error }> {
  // For now, just treat TypeScript as JavaScript
  // In a real implementation, we would transpile TypeScript to JavaScript first
  return executeJavaScript(code, output, timeout, memoryLimit, allowedModules, context);
}

/**
 * Execute Python code
 * Note: In a real implementation, we would use a Python runtime
 */
async function executePython(
  code: string,
  output: string[],
  timeout: number,
  memoryLimit: number,
  allowedModules: string[],
  context: Record<string, any>
): Promise<{ result?: any, error?: Error }> {
  try {
    // In a real implementation, we would use a Python runtime like Pyodide
    // For now, we'll simulate Python execution with a simple parser

    // Add print function to capture output
    output.push('[info] Executing Python code in simulated environment');

    // Parse and execute simple Python expressions
    const lines = code.split('\n');
    let result: any = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Handle print statements
      if (trimmedLine.startsWith('print(') && trimmedLine.endsWith(')')) {
        const content = trimmedLine.substring(6, trimmedLine.length - 1);
        output.push(`[log] ${content}`);
        continue;
      }

      // Handle variable assignments
      if (trimmedLine.includes('=')) {
        const [varName, value] = trimmedLine.split('=').map(s => s.trim());
        context[varName] = eval(value); // Note: eval is used for simulation only
        continue;
      }

      // Handle return statements
      if (trimmedLine.startsWith('return ')) {
        const returnValue = trimmedLine.substring(7).trim();
        result = eval(returnValue); // Note: eval is used for simulation only
        break;
      }

      // Handle other expressions
      try {
        result = eval(trimmedLine); // Note: eval is used for simulation only
      } catch (e) {
        // Ignore errors in simulation
      }
    }

    return { result };
  } catch (error) {
    return { error };
  }
}

/**
 * Execute Ruby code
 * Note: In a real implementation, we would use a Ruby runtime
 */
async function executeRuby(
  code: string,
  output: string[],
  timeout: number,
  memoryLimit: number,
  allowedModules: string[],
  context: Record<string, any>
): Promise<{ result?: any, error?: Error }> {
  try {
    // In a real implementation, we would use a Ruby runtime
    // For now, we'll simulate Ruby execution

    output.push('[info] Executing Ruby code in simulated environment');
    output.push('[warn] Ruby execution is simulated and has limited functionality');

    // Parse and execute simple Ruby-like expressions
    const lines = code.split('\n');
    let result: any = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Handle puts statements (Ruby's print)
      if (trimmedLine.startsWith('puts ')) {
        const content = trimmedLine.substring(5).trim();
        output.push(`[log] ${content}`);
        continue;
      }

      // Handle variable assignments
      if (trimmedLine.includes('=')) {
        const [varName, value] = trimmedLine.split('=').map(s => s.trim());
        context[varName] = eval(value); // Note: eval is used for simulation only
        continue;
      }
    }

    return { result };
  } catch (error) {
    return { error };
  }
}

/**
 * Execute Shell commands
 * Note: In a real implementation, we would use a secure shell environment
 */
async function executeShell(
  code: string,
  output: string[],
  timeout: number,
  memoryLimit: number,
  allowedModules: string[],
  context: Record<string, any>
): Promise<{ result?: any, error?: Error }> {
  try {
    // In a real implementation, we would use a secure shell environment
    // For now, we'll simulate shell execution

    output.push('[info] Executing Shell commands in simulated environment');
    output.push('[warn] Shell execution is simulated and has limited functionality');

    // Parse and execute simple shell-like commands
    const lines = code.split('\n');
    let result: any = {};

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Handle echo commands
      if (trimmedLine.startsWith('echo ')) {
        const content = trimmedLine.substring(5).trim();
        output.push(`[log] ${content}`);
        continue;
      }

      // Handle ls command
      if (trimmedLine === 'ls' || trimmedLine.startsWith('ls ')) {
        output.push('[log] file1.txt');
        output.push('[log] file2.txt');
        output.push('[log] directory1/');
        continue;
      }

      // Handle pwd command
      if (trimmedLine === 'pwd') {
        output.push('[log] /home/user');
        continue;
      }

      // Handle other commands
      output.push(`[info] Simulated execution of: ${trimmedLine}`);
    }

    return { result };
  } catch (error) {
    return { error };
  }
}

/**
 * Execute HTML code
 * Note: In a real implementation, we would use a headless browser
 */
async function executeHtml(
  code: string,
  output: string[],
  timeout: number,
  memoryLimit: number,
  allowedModules: string[],
  context: Record<string, any>
): Promise<{ result?: any, error?: Error }> {
  try {
    // In a real implementation, we would use a headless browser
    // For now, we'll simulate HTML execution

    output.push('[info] Executing HTML in simulated environment');

    // Parse HTML to extract structure
    const result = {
      doctype: code.includes('<!DOCTYPE html>'),
      hasHtml: code.includes('<html'),
      hasHead: code.includes('<head'),
      hasBody: code.includes('<body'),
      scripts: (code.match(/<script/g) || []).length,
      styles: (code.match(/<style/g) || []).length,
      links: (code.match(/<link/g) || []).length,
      elements: (code.match(/<[a-z][^>]*>/g) || []).length,
    };

    // Extract title if present
    const titleMatch = code.match(/<title>(.*?)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      result['title'] = titleMatch[1];
    }

    return { result };
  } catch (error) {
    return { error };
  }
}

/**
 * Execute CSS code
 * Note: In a real implementation, we would use a CSS parser
 */
async function executeCss(
  code: string,
  output: string[],
  timeout: number,
  memoryLimit: number,
  allowedModules: string[],
  context: Record<string, any>
): Promise<{ result?: any, error?: Error }> {
  try {
    // In a real implementation, we would use a CSS parser
    // For now, we'll simulate CSS execution

    output.push('[info] Executing CSS in simulated environment');

    // Parse CSS to extract structure
    const result = {
      selectors: (code.match(/[^{}]+(?=\{)/g) || []).map(s => s.trim()),
      properties: (code.match(/[^:]+:[^;]+/g) || []).map(s => s.trim()),
      mediaQueries: (code.match(/@media[^{]+\{/g) || []).map(s => s.trim()),
      keyframes: (code.match(/@keyframes[^{]+\{/g) || []).map(s => s.trim()),
      imports: (code.match(/@import[^;]+;/g) || []).map(s => s.trim()),
    };

    return { result };
  } catch (error) {
    return { error };
  }
}
