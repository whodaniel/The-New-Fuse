"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolCallInterceptor = exports.ToolCallInterceptSchema = void 0;
const zod_1 = require("zod");
exports.ToolCallInterceptSchema = zod_1.z.object({
    toolName: zod_1.z.string(),
    args: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    result: zod_1.z.unknown().optional(),
    error: zod_1.z.string().optional(),
    durationMs: zod_1.z.number().optional(),
    interceptedAt: zod_1.z.number().default(() => Date.now()),
});
class ToolCallInterceptor {
    constructor(options) {
        this.hooks = new Map();
        this.log = [];
        this.maxLogSize = 10000;
        this.enabled = true;
        this.maxLogSize = options?.maxLogSize ?? 10000;
        this.enabled = options?.enabled ?? true;
    }
    registerHook(hook) {
        this.hooks.set(hook.name, hook);
    }
    removeHook(name) {
        this.hooks.delete(name);
    }
    async interceptCall(toolName, args, executor) {
        if (!this.enabled) {
            return executor();
        }
        let processedArgs = args;
        const entry = {
            toolName,
            args: { ...args },
            interceptedAt: Date.now(),
        };
        for (const hook of this.hooks.values()) {
            if (hook.beforeCall) {
                const modified = hook.beforeCall(toolName, processedArgs);
                if (modified === null) {
                    entry.error = `Blocked by hook: ${hook.name}`;
                    this.appendLog(entry);
                    throw new Error(`Tool call to "${toolName}" blocked by hook "${hook.name}"`);
                }
                processedArgs = modified;
            }
        }
        const start = Date.now();
        try {
            const result = await executor();
            entry.result = result;
            entry.durationMs = Date.now() - start;
            for (const hook of this.hooks.values()) {
                if (hook.afterCall) {
                    hook.afterCall(toolName, processedArgs, result);
                }
            }
            return result;
        }
        catch (err) {
            entry.error = err.message ?? String(err);
            entry.durationMs = Date.now() - start;
            for (const hook of this.hooks.values()) {
                if (hook.onError) {
                    hook.onError(toolName, processedArgs, err);
                }
            }
            throw err;
        }
        finally {
            this.appendLog(entry);
        }
    }
    getLog(filter) {
        return this.log.filter(e => {
            if (filter?.toolName && e.toolName !== filter.toolName)
                return false;
            if (filter?.from && e.interceptedAt < filter.from)
                return false;
            if (filter?.to && e.interceptedAt > filter.to)
                return false;
            return true;
        });
    }
    enable() { this.enabled = true; }
    disable() { this.enabled = false; }
    isEnabled() { return this.enabled; }
    clearLog() { this.log = []; }
    appendLog(entry) {
        this.log.push(entry);
        if (this.log.length > this.maxLogSize) {
            this.log.splice(0, this.log.length - this.maxLogSize);
        }
    }
}
exports.ToolCallInterceptor = ToolCallInterceptor;
//# sourceMappingURL=toolCallInterceptor.js.map