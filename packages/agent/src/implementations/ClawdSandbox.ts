import * as vm from 'vm';

export interface SandboxOptions {
  timeout?: number;
  allowedGlobals?: Record<string, unknown>;
}

/**
 * ClawdSandbox
 *
 * Provides a secure(r) execution environment for usage by the ClawdEngine.
 * Uses Node's `vm` module to isolate execution context.
 *
 * NOTE: Node's `vm` module is NOT a security mechanism for untrusted code.
 * It is used here to prevent accidental pollution and provide a constrained environment
 * for "Assimilated" internal skills. For truly untrusted code, process isolation is required.
 */
export class ClawdSandbox {
  private context: vm.Context;

  constructor(options: SandboxOptions = {}) {
    const baseGlobals = {
      console: {
        log: (...args: unknown[]) => console.log('[Sandbox]', ...args),
        error: (...args: unknown[]) => console.error('[Sandbox Error]', ...args),
        warn: (...args: unknown[]) => console.warn('[Sandbox Warn]', ...args),
      },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Buffer,
      // Default return for async IIFE wrapper
      __result: undefined,
    };

    this.context = vm.createContext({
      ...baseGlobals,
      ...options.allowedGlobals,
    });
  }

  /**
   * Execute code within the sandbox
   * @param code JavaScript code to execute
   * @param args Arguments to pass to the code (will be available as `args` global)
   */
  public async execute(code: string, args: unknown = {}): Promise<unknown> {
    const sandboxArgs = { args };

    // We wrap the user code in an async IFFE to support await and return values
    // The pattern is: (async (args) => { ...code... })(args)
    const wrappedCode = `
      (async function(args) {
        try {
          ${code}
        } catch (e) {
          throw e;
        }
      })(args)
    `;

    try {
      // Inject args into context for this run
      const runContext = vm.createContext({
        ...this.context,
        args,
      });

      const script = new vm.Script(wrappedCode);
      return await script.runInContext(runContext, {
        timeout: 5000, // Default 5s timeout
        displayErrors: true,
      });
    } catch (error) {
      throw new Error(
        `Sandbox Execution Failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
