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
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';
let CreateProviderDto = (() => {
    var _a;
    let _userId_decorators;
    let _userId_initializers = [];
    let _userId_extraInitializers = [];
    let _providerName_decorators;
    let _providerName_initializers = [];
    let _providerName_extraInitializers = [];
    let _apiKey_decorators;
    let _apiKey_initializers = [];
    let _apiKey_extraInitializers = [];
    return _a = class CreateProviderDto {
            constructor() {
                this.userId = __runInitializers(this, _userId_initializers, void 0);
                this.providerName = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _providerName_initializers, void 0));
                this.apiKey = (__runInitializers(this, _providerName_extraInitializers), __runInitializers(this, _apiKey_initializers, void 0));
                __runInitializers(this, _apiKey_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _userId_decorators = [ApiProperty({ description: 'User ID associated with the provider' }), IsString(), IsNotEmpty()];
            _providerName_decorators = [ApiProperty({
                    enum: ['openai', 'anthropic', 'cohere'],
                    description: 'Name of the LLM provider'
                }), IsString(), IsIn(['openai', 'anthropic', 'cohere'])];
            _apiKey_decorators = [ApiProperty({ description: 'API key for the LLM provider' }), IsString(), IsNotEmpty()];
            __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: obj => "userId" in obj, get: obj => obj.userId, set: (obj, value) => { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
            __esDecorate(null, null, _providerName_decorators, { kind: "field", name: "providerName", static: false, private: false, access: { has: obj => "providerName" in obj, get: obj => obj.providerName, set: (obj, value) => { obj.providerName = value; } }, metadata: _metadata }, _providerName_initializers, _providerName_extraInitializers);
            __esDecorate(null, null, _apiKey_decorators, { kind: "field", name: "apiKey", static: false, private: false, access: { has: obj => "apiKey" in obj, get: obj => obj.apiKey, set: (obj, value) => { obj.apiKey = value; } }, metadata: _metadata }, _apiKey_initializers, _apiKey_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { CreateProviderDto };
