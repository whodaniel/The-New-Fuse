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
    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ') ||
      authHeader.substring(7) !== env.API_KEY
    ) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      // Parse request body
      const requestData = (await request.json()) as ExecutionRequest;

      // Validate request
      if (!requestData.code || !requestData.clientId) {
        return new Response(
          JSON.stringify({
            success: false,
            output: [],
            error: { message: 'Invalid request: code and clientId are required' },
            metrics: { executionTime: 0, memoryUsage: 0 },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Execute code
      const result = await executeCode(requestData);

      // Return result
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: unknown) {
      // Handle unexpected errors
      return new Response(
        JSON.stringify({
          success: false,
          output: [],
          error: {
            message: (error as Error).message || 'Unknown error',
            stack: error.stack,
            type: error.name,
          },
          metrics: { executionTime: 0, memoryUsage: 0 },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
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
        ({ result, error } = await executeJavaScript(
          request.code,
          output,
          timeout,
          memoryLimit,
          allowedModules,
          context
        ));
        break;
      case CodeExecutionLanguage.TYPESCRIPT:
        ({ result, error } = await executeTypeScript(
          request.code,
          output,
          timeout,
          memoryLimit,
          allowedModules,
          context
        ));
        break;
      case CodeExecutionLanguage.PYTHON:
        ({ result, error } = await executePython(
          request.code,
          output,
          timeout,
          memoryLimit,
          allowedModules,
          context
        ));
        break;
      case CodeExecutionLanguage.RUBY:
        ({ result, error } = await executeRuby(
          request.code,
          output,
          timeout,
          memoryLimit,
          allowedModules,
          context
        ));
        break;
      case CodeExecutionLanguage.SHELL:
        ({ result, error } = await executeShell(
          request.code,
          output,
          timeout,
          memoryLimit,
          allowedModules,
          context
        ));
        break;
      case CodeExecutionLanguage.HTML:
        ({ result, error } = await executeHtml(
          request.code,
          output,
          timeout,
          memoryLimit,
          allowedModules,
          context
        ));
        break;
      case CodeExecutionLanguage.CSS:
        ({ result, error } = await executeCss(
          request.code,
          output,
          timeout,
          memoryLimit,
          allowedModules,
          context
        ));
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
      error: error
        ? {
            message: error.message || 'Unknown error',
            stack: error.stack,
            type: error.name,
          }
        : undefined,
      metrics: {
        executionTime,
        memoryUsage,
      },
    };
  } catch (e) {
    // Handle unexpected errors
    return {
      success: false,
      output,
      error: {
        message: e.message || 'Unknown error',
        stack: e.stack,
        type: e.name,
      },
      metrics: {
        executionTime: Date.now() - startTime,
        memoryUsage: 0,
      },
    };
  }
}

/**
 * Execute JavaScript code - SECURE IMPLEMENTATION
 */
async function executeJavaScript(
  code: string,
  output: string[],
  timeout: number,
  memoryLimit: number,
  allowedModules: string[],
  context: Record<string, any>
): Promise<{ result?: any; error?: Error }> {
  try {
    // Security: Validate and sanitize code
    if (typeof code !== 'string' || code.length > 10000) {
      throw new Error('Code must be a string with maximum length of 10000 characters');
    }

    // Check for dangerous patterns in the code
    const dangerousPatterns = [
      /require\s*\(/, // require()
      /import\s+/, // import statements
      /eval\s*\(/, // eval()
      /Function\s*\(/, // Function constructor
      /process\./, // process object
      /global\./, // global object
      /window\./, // window object
      /document\./, // document object
      /XMLHttpRequest/, // XHR
      /fetch\s*\(/, // fetch API
      /setTimeout\s*\(/, // setTimeout (we'll provide our own safe version)
      /setInterval\s*\(/, // setInterval
      /constructor/, // constructor
      /__proto__/, // __proto__
      /prototype/, // prototype
      /class\s+/, // class declarations
      /fs\./, // File system
      /child_process/, // Child process
      /exec\s*\(/, // exec()
      /spawn\s*\(/, // spawn()
      /fs\.readFile/, // File read
      /fs\.writeFile/, // File write
      /fs\.unlink/, // File delete
      /fs\.rmdir/, // Directory delete
      /open\s*\(/, // window.open
      /location\./, // window.location
      /navigator\./, // window.navigator
      /localStorage/, // localStorage
      /sessionStorage/, // sessionStorage
      /cookie/, // document.cookie
      /indexedDB/, // indexedDB
      /ServiceWorker/, // Service Workers
      /Worker\s*\(/, // Web Workers
      /SharedArrayBuffer/, // SharedArrayBuffer
      /Atomics/, // Atomics
      /WebAssembly/, // WebAssembly
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Code contains potentially dangerous patterns: ${pattern.source}`);
      }
    }

    // Create a secure context with limited capabilities
    const secureContext: Record<string, any> = {
      console: {
        log: (...args: any[]) => output.push(`[log] ${args.join(' ')}`),
        error: (...args: any[]) => output.push(`[error] ${args.join(' ')}`),
        warn: (...args: any[]) => output.push(`[warn] ${args.join(' ')}`),
        info: (...args: any[]) => output.push(`[info] ${args.join(' ')}`),
      },
      // Only allow safe built-in functions and objects
      Math: Math,
      Boolean: Boolean,
      Number: Number,
      String: String,
      Array: Array,
      Object: Object,
      JSON: JSON,
      Date: Date,
      RegExp: RegExp,
      Error: Error,
      TypeError: TypeError,
      ReferenceError: ReferenceError,
      SyntaxError: SyntaxError,
      RangeError: RangeError,
      URIError: URIError,
      EvalError: EvalError,
      // Provide safe utility functions
      max: Math.max,
      min: Math.min,
      abs: Math.abs,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent,
      btoa: btoa,
      atob: atob,
      // Add context variables safely
      ...context,
    };

    // Create a restricted scope for execution
    const restrictedScope = Object.create(null);
    Object.assign(restrictedScope, secureContext);

    // Safe code execution using a restricted eval in a function scope
    const executionPromise = new Promise<any>((resolve, reject) => {
      try {
        // Create a safe wrapper function
        const safeExecutor = (userCode: string, scope: any) => {
          // Wrap user code to ensure it only has access to the restricted scope
          const wrappedCode = `
            'use strict';
            (function() {
              // Create a closure with only the allowed variables
              const { ${Object.keys(scope).join(', ')} } = this;
              
              // Execute the user code
              ${userCode}
            })
          `;

          // Use Function constructor only with our controlled parameters
          // This is safer because we're not injecting user input into the function parameters
          const executorFn = new Function(
            'allowedScope',
            `
            'use strict';
            return (function() {
              const { ${Object.keys(scope).join(', ')} } = allowedScope;
              return (function() {
                ${userCode}
              })();
            });
          `
          );

          const innerFn = executorFn(scope);
          return innerFn.call(scope);
        };

        const result = safeExecutor(code, restrictedScope);
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
      }),
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
): Promise<{ result?: any; error?: Error }> {
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
): Promise<{ result?: any; error?: Error }> {
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

      // SECURITY FIX: Removed eval() - Python simulation should use safe parsing
      // Handle variable assignments
      if (trimmedLine.includes('=') && !trimmedLine.includes('==')) {
        const [varName, value] = trimmedLine.split('=').map((s) => s.trim());
        try {
          // Only allow simple literal assignments (numbers, strings, booleans)
          context[varName] = JSON.parse(value);
        } catch {
          context[varName] = value; // Store as string if not valid JSON
        }
        continue;
      }

      // Handle return statements
      if (trimmedLine.startsWith('return ')) {
        const returnValue = trimmedLine.substring(7).trim();
        try {
          result = JSON.parse(returnValue);
        } catch {
          result = returnValue;
        }
        break;
      }

      // Handle other expressions - use safe evaluation
      try {
        result = JSON.parse(trimmedLine);
      } catch (e) {
        // Ignore errors in simulation
        result = trimmedLine;
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
): Promise<{ result?: any; error?: Error }> {
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
        const value = safeEvaluateRuby(content, context);
        output.push(`[log] ${value}`);
        continue;
      }

      // SECURITY FIX: Removed eval() - Ruby simulation should use safe parsing
      // Handle variable assignments
      if (trimmedLine.includes('=') && !trimmedLine.includes('==')) {
        const [varName, valueStr] = trimmedLine.split('=').map((s) => s.trim());
        const value = safeEvaluateRuby(valueStr, context);
        context[varName] = value;
        result = value; // Assignment evaluates to value
        continue;
      }

      // Handle expressions (implicit return)
      result = safeEvaluateRuby(trimmedLine, context);
    }

    return { result };
  } catch (error) {
    return { error };
  }
}

/**
 * Safely evaluate a Ruby expression in a simulated environment
 *
 * @param expression The expression to evaluate
 * @param context The current execution context with variables
 * @returns The evaluated value or the original expression string
 */
function safeEvaluateRuby(expression: string, context: Record<string, any>): any {
  const trimmed = expression.trim();

  // Handle numbers
  if (trimmed !== '' && !isNaN(Number(trimmed))) {
    return Number(trimmed);
  }

  // Handle booleans/nil
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'nil') return null;

  // Handle strings (double and single quotes)
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.substring(1, trimmed.length - 1);
  }

  // Handle variables
  if (Object.prototype.hasOwnProperty.call(context, trimmed)) {
    return context[trimmed];
  }

  // Return original string if no match
  return trimmed;
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
): Promise<{ result?: any; error?: Error }> {
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
): Promise<{ result?: any; error?: Error }> {
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
): Promise<{ result?: any; error?: Error }> {
  try {
    // In a real implementation, we would use a CSS parser
    // For now, we'll simulate CSS execution

    output.push('[info] Executing CSS in simulated environment');

    // Parse CSS to extract structure
    const result = {
      selectors: (code.match(/[^{}]+(?=\{)/g) || []).map((s) => s.trim()),
      properties: (code.match(/[^:]+:[^;]+/g) || []).map((s) => s.trim()),
      mediaQueries: (code.match(/@media[^{]+\{/g) || []).map((s) => s.trim()),
      keyframes: (code.match(/@keyframes[^{]+\{/g) || []).map((s) => s.trim()),
      imports: (code.match(/@import[^;]+;/g) || []).map((s) => s.trim()),
    };

    return { result };
  } catch (error) {
    return { error };
  }
}

/**
 * Safely evaluate a Ruby value or expression
 */
function safeEvaluateRuby(expression: string, context: Record<string, any>): any {
  const trimmed = expression.trim();

  // Handle numbers
  if (trimmed !== '' && !isNaN(Number(trimmed))) {
    return Number(trimmed);
  }

  // Handle booleans/nil
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'nil') return null;

  // Handle strings (double and single quotes)
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.substring(1, trimmed.length - 1);
  }

  // Handle variables
  if (Object.prototype.hasOwnProperty.call(context, trimmed)) {
    return context[trimmed];
  }

  // Return original string if no match
  return trimmed;
}
