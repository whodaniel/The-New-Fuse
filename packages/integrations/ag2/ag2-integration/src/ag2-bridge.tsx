interface AG2BridgeConfig {
    pythonServiceUrl?: string;
    retryConfig?: { maxRetries: number; backoffMs: number };
    timeout?: number;
}

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers): any {
    function accept(f): any { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f): any { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value): any {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __importStar = (this && this.__importStar) || function (mod): any {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix): any {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
export {}
exports.AG2Bridge = void 0;
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

let AG2Bridge = exports.AG2Bridge = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AG2Bridge = _classThis = class {
        constructor(config?: AG2BridgeConfig) {
            this.logger = new Logger(AG2Bridge.name);
            this.config = {
                pythonServiceUrl: config?.pythonServiceUrl ?? process.env.AG2_PYTHON_URL ?? 'http://localhost:8000',
                retryConfig: config?.retryConfig ?? { maxRetries: 3, backoffMs: 1000 },
                timeout: config?.timeout ?? 30000,
            };
            this.pythonServiceUrl = this.config.pythonServiceUrl;
            this.axiosInstance = axios.create({
                baseURL: this.pythonServiceUrl,
                timeout: this.config.timeout,
            });
        }
        async withRetry<T>(request: () => Promise<T>): Promise<T> {
            let lastError: Error | null = null;
            const { maxRetries, backoffMs } = this.config.retryConfig;
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    return await request();
                }
                catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    if (attempt === maxRetries)
                        break;
                    const delay = backoffMs * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            throw lastError!;
        }
        async getFeatures(): Promise<any[]> {
            try {
                const response = await this.withRetry(() => this.axiosInstance.get('/features'));
                if (!response.data?.data || !Array.isArray(response.data.data)) {
                    throw new Error('Invalid features response format');
                }
                return response.data.data;
            }
            catch (error) {
                const errorMessage = error instanceof AxiosError
                    ? `Failed to fetch AG2 features: ${error.message}`
                    : 'Failed to fetch AG2 features';
                this.logger.error(errorMessage);
                return [];
            }
        }
        async getVersion(): Promise<string> {
            try {
                const response = await this.withRetry(() => this.axiosInstance.get('/version'));
                if (typeof response.data?.data !== 'string') {
                    throw new Error('Invalid version response format');
                }
                return response.data.data;
            }
            catch (error) {
                const errorMessage = error instanceof AxiosError
                    ? `Failed to fetch AG2 version: ${error.message}`
                    : 'Failed to fetch AG2 version';
                this.logger.error(errorMessage);
                return 'unknown';
            }
        }
        async getDependencies(): Promise<any[]> {
            try {
                const response = await this.withRetry(() => this.axiosInstance.get('/dependencies'));
                if (!response.data?.data || !Array.isArray(response.data.data)) {
                    throw new Error('Invalid dependencies response format');
                }
                return response.data.data;
            }
            catch (error) {
                const errorMessage = error instanceof AxiosError
                    ? `Failed to fetch AG2 dependencies: ${error.message}`
                    : 'Failed to fetch AG2 dependencies';
                this.logger.error(errorMessage);
                return [];
            }
        }
        async isHealthy(): Promise<boolean> {
            try {
                const response = await this.withRetry(() => this.axiosInstance.get('/health'));
                if (typeof response.data?.data?.status !== 'string') {
                    throw new Error('Invalid health check response format');
                }
                return response.data.data.status === 'ok';
            }
            catch (error) {
                const errorMessage = error instanceof AxiosError
                    ? `AG2 health check failed: ${error.message}`
                    : 'AG2 health check failed';
                this.logger.error(errorMessage);
                return false;
            }
        }
        async sendMessage(message: any): Promise<any> {
            try {
                const response = await this.withRetry(() => this.axiosInstance.post('/messages', message));
                return response.data;
            }
            catch (error) {
                const errorMessage = error instanceof AxiosError
                    ? `Failed to send message: ${error.message}`
                    : 'Failed to send message';
                this.logger.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        }
        async getMessages(conversationId: string): Promise<any[]> {
            try {
                const response = await this.withRetry(() => this.axiosInstance.get(`/messages/${conversationId}`));
                if (!response.data?.data || !Array.isArray(response.data.data)) {
                    throw new Error('Invalid messages response format');
                }
                return response.data.data;
            }
            catch (error) {
                const errorMessage = error instanceof AxiosError
                    ? `Failed to fetch messages: ${error.message}`
                    : 'Failed to fetch messages';
                this.logger.error(errorMessage);
                return [];
            }
        }
        async registerTool(tool: any): Promise<any> {
            try {
                const response = await this.withRetry(() => this.axiosInstance.post('/tools', tool));
                return response.data;
            }
            catch (error) {
                const errorMessage = error instanceof AxiosError
                    ? `Failed to register tool: ${error.message}`
                    : 'Failed to register tool';
                this.logger.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        }
        async getTools(): Promise<any[]> {
            try {
                const response = await this.withRetry(() => this.axiosInstance.get('/tools'));
                if (!response.data?.data || !Array.isArray(response.data.data)) {
                    throw new Error('Invalid tools response format');
                }
                return response.data.data;
            }
            catch (error) {
                const errorMessage = error instanceof AxiosError
                    ? `Failed to fetch tools: ${error.message}`
                    : 'Failed to fetch tools';
                this.logger.error(errorMessage);
                return [];
            }
        }
        async executeTool(toolId: string, args: any): Promise<any> {
            try {
                const response = await this.withRetry(() => this.axiosInstance.post(`/tools/${toolId}/execute`, { args }));
                return response.data;
            }
            catch (error) {
                const errorMessage = error instanceof AxiosError
                    ? `Failed to execute tool: ${error.message}`
                    : 'Failed to execute tool';
                this.logger.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        }
    };
    __setFunctionName(_classThis, "AG2Bridge");
    (() => {
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name }, null, _classExtraInitializers);
        AG2Bridge = _classThis = _classDescriptor.value;
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AG2Bridge = _classThis;
})();
export {};
