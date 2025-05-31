var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Controller, Get, Post, Put, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
let LLMProviderController = (() => {
    let _classDecorators = [ApiTags('llm'), Controller('api/llm/providers')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _create_decorators;
    let _findOne_decorators;
    let _update_decorators;
    let _remove_decorators;
    let _setDefault_decorators;
    var LLMProviderController = _classThis = class {
        constructor(llmProviderService) {
            this.llmProviderService = (__runInitializers(this, _instanceExtraInitializers), llmProviderService);
        }
        async findAll() {
            try {
                return await this.llmProviderService.findAll();
            }
            catch (error) {
                throw new HttpException(`Failed to fetch LLM providers: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async create(createLLMProviderDto) {
            try {
                return await this.llmProviderService.create(createLLMProviderDto);
            }
            catch (error) {
                throw new HttpException(`Failed to create LLM provider: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async findOne(id) {
            try {
                return await this.llmProviderService.findById(id);
            }
            catch (error) {
                throw new HttpException(`Failed to find LLM provider: ${error.message}`, HttpStatus.NOT_FOUND);
            }
        }
        async update(id, updateLLMProviderDto) {
            try {
                return await this.llmProviderService.update(id, updateLLMProviderDto);
            }
            catch (error) {
                throw new HttpException(`Failed to update LLM provider: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async remove(id) {
            try {
                await this.llmProviderService.delete(id);
                return { success: true };
            }
            catch (error) {
                throw new HttpException(`Failed to delete LLM provider: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async setDefault(id) {
            try {
                return await this.llmProviderService.setDefault(id);
            }
            catch (error) {
                throw new HttpException(`Failed to set LLM provider as default: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "LLMProviderController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findAll_decorators = [Get(), ApiOperation({ summary: 'Get all LLM providers' }), ApiResponse({ status: 200, description: 'Returns all available LLM providers' })];
        _create_decorators = [Post(), ApiOperation({ summary: 'Create a new LLM provider' }), ApiBody({ type: CreateLLMProviderDTO }), ApiResponse({ status: 201, description: 'The LLM provider has been successfully created' })];
        _findOne_decorators = [Get(':id'), ApiOperation({ summary: 'Get an LLM provider by ID' }), ApiResponse({ status: 200, description: 'Returns the LLM provider' }), ApiResponse({ status: 404, description: 'LLM provider not found' })];
        _update_decorators = [Put(':id'), ApiOperation({ summary: 'Update an LLM provider' }), ApiResponse({ status: 200, description: 'The LLM provider has been successfully updated' })];
        _remove_decorators = [Delete(':id'), ApiOperation({ summary: 'Delete an LLM provider' }), ApiResponse({ status: 200, description: 'The LLM provider has been successfully deleted' })];
        _setDefault_decorators = [Put(':id/default'), ApiOperation({ summary: 'Set an LLM provider as default' }), ApiResponse({ status: 200, description: 'The LLM provider has been set as default' })];
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _setDefault_decorators, { kind: "method", name: "setDefault", static: false, private: false, access: { has: obj => "setDefault" in obj, get: obj => obj.setDefault }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LLMProviderController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LLMProviderController = _classThis;
})();
export { LLMProviderController };
