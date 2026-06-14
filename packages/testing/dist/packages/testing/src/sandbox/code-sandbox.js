"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeSandbox = void 0;
const vm_1 = require("vm");
const events_1 = require("events");
class CodeSandbox extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            timeout: options.timeout || 5000,
            memoryLimit: options.memoryLimit || 50 * 1024 * 1024, // 50MB
            allowedModules: options.allowedModules || [],
            context: options.context || {},
        };
        this.initializeContext();
    }
    initializeContext() {
        // Create a secure context with limited capabilities
        const context = (0, vm_1.createContext)({
            console: {
                log: (...args) => this.emit('output', 'log', ...args),
                error: (...args) => this.emit('output', 'error', ...args),
                warn: (...args) => this.emit('output', 'warn', ...args),
            },
            setTimeout: (cb, ms) => {
                if (ms > this.options.timeout) {
                    throw new Error('setTimeout duration exceeds sandbox timeout');
                }
                return setTimeout(cb, ms);
            },
            clearTimeout,
            Buffer: {
                from: Buffer.from,
                isBuffer: Buffer.isBuffer,
            },
            ...this.options.context,
        });
        // Add allowed modules to context
        this.options.allowedModules.forEach(moduleName => {
            try {
                context[moduleName] = require(moduleName);
            }
            catch (error) {
                console.warn(`Failed to load module ${moduleName}:`, error);
            }
        });
        this.context = context;
    }
    async execute(code) {
        const output = [];
        const startTime = Date.now();
        let error;
        let result;
        // Collect console output
        this.on('output', (type, ...args) => {
            output.push(`[${type}] ${args.join(' ')}`);
        });
        try {
            // Wrap code in memory limit check
            const wrappedCode = `
        const startMem = process.memoryUsage().heapUsed;
        ${code}
        const endMem = process.memoryUsage().heapUsed;
        if (endMem - startMem > ${this.options.memoryLimit}) {
          throw new Error('Memory limit exceeded');
        }
      `;
            // Create and run script with timeout
            const script = new vm_1.Script(wrappedCode);
            result = await Promise.race([
                script.runInContext(this.context, {
                    timeout: this.options.timeout,
                    displayErrors: true,
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Execution timeout')), this.options.timeout)),
            ]);
        }
        catch (e) {
            error = e;
        }
        const executionTime = Date.now() - startTime;
        const memoryUsage = process.memoryUsage().heapUsed;
        return {
            success: !error,
            output,
            error,
            result,
            memoryUsage,
            executionTime,
        };
    }
    /**
     * Reset the sandbox context
     */
    reset() {
        this.removeAllListeners();
        this.initializeContext();
    }
}
exports.CodeSandbox = CodeSandbox;
//# sourceMappingURL=code-sandbox.js.map