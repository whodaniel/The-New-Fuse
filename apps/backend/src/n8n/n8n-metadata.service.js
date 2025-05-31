var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@the-new-fuse/utils';
let N8nMetadataService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var N8nMetadataService = _classThis = class {
        constructor(httpService, configService) {
            this.httpService = httpService;
            this.configService = configService;
            this.logger = new Logger({ prefix: 'N8nMetadataService' });
        }
        async getAllNodeTypes() {
            try {
                const n8nUrl = this.configService.get('N8N_URL');
                const n8nApiKey = this.configService.get('N8N_API_KEY');
                if (!n8nUrl || !n8nApiKey) {
                    throw new Error('N8N configuration missing');
                }
                const response = await firstValueFrom(this.httpService.get(`${n8nUrl}/api/v1/node-types`, {
                    headers: {
                        'X-N8N-API-KEY': n8nApiKey,
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error('Failed to fetch node types', error);
                throw error;
            }
        }
        async getNodeTypeDescription(nodeType) {
            try {
                const n8nUrl = this.configService.get('N8N_URL');
                const n8nApiKey = this.configService.get('N8N_API_KEY');
                if (!n8nUrl || !n8nApiKey) {
                    throw new Error('N8N configuration missing');
                }
                const response = await firstValueFrom(this.httpService.get(`${n8nUrl}/api/v1/node-types/${nodeType}`, {
                    headers: {
                        'X-N8N-API-KEY': n8nApiKey,
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error(`Failed to fetch node type description for ${nodeType}`, error);
                throw error;
            }
        }
        async getCredentialTypes() {
            try {
                const n8nUrl = this.configService.get('N8N_URL');
                const n8nApiKey = this.configService.get('N8N_API_KEY');
                if (!n8nUrl || !n8nApiKey) {
                    throw new Error('N8N configuration missing');
                }
                const response = await firstValueFrom(this.httpService.get(`${n8nUrl}/api/v1/credentials/schema`, {
                    headers: {
                        'X-N8N-API-KEY': n8nApiKey,
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error('Failed to fetch credential types', error);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "N8nMetadataService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        N8nMetadataService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return N8nMetadataService = _classThis;
})();
export { N8nMetadataService };
