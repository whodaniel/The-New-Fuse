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
import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
let CreateMessageDto = (() => {
    var _a;
    let _content_decorators;
    let _content_initializers = [];
    let _content_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _attachments_decorators;
    let _attachments_initializers = [];
    let _attachments_extraInitializers = [];
    let _parentMessageId_decorators;
    let _parentMessageId_initializers = [];
    let _parentMessageId_extraInitializers = [];
    return _a = class CreateMessageDto {
            constructor() {
                this.content = __runInitializers(this, _content_initializers, void 0);
                this.metadata = (__runInitializers(this, _content_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
                this.attachments = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _attachments_initializers, void 0));
                this.parentMessageId = (__runInitializers(this, _attachments_extraInitializers), __runInitializers(this, _parentMessageId_initializers, void 0));
                __runInitializers(this, _parentMessageId_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _content_decorators = [ApiProperty(), IsString()];
            _metadata_decorators = [ApiProperty({ required: false }), IsObject(), IsOptional()];
            _attachments_decorators = [ApiProperty({ required: false }), IsArray(), IsOptional()];
            _parentMessageId_decorators = [ApiProperty({ required: false }), IsString(), IsOptional()];
            __esDecorate(null, null, _content_decorators, { kind: "field", name: "content", static: false, private: false, access: { has: obj => "content" in obj, get: obj => obj.content, set: (obj, value) => { obj.content = value; } }, metadata: _metadata }, _content_initializers, _content_extraInitializers);
            __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
            __esDecorate(null, null, _attachments_decorators, { kind: "field", name: "attachments", static: false, private: false, access: { has: obj => "attachments" in obj, get: obj => obj.attachments, set: (obj, value) => { obj.attachments = value; } }, metadata: _metadata }, _attachments_initializers, _attachments_extraInitializers);
            __esDecorate(null, null, _parentMessageId_decorators, { kind: "field", name: "parentMessageId", static: false, private: false, access: { has: obj => "parentMessageId" in obj, get: obj => obj.parentMessageId, set: (obj, value) => { obj.parentMessageId = value; } }, metadata: _metadata }, _parentMessageId_initializers, _parentMessageId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { CreateMessageDto };
let MessageResponseDto = (() => {
    var _a;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _content_decorators;
    let _content_initializers = [];
    let _content_extraInitializers = [];
    let _sender_decorators;
    let _sender_initializers = [];
    let _sender_extraInitializers = [];
    let _timestamp_decorators;
    let _timestamp_initializers = [];
    let _timestamp_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _attachments_decorators;
    let _attachments_initializers = [];
    let _attachments_extraInitializers = [];
    let _parentMessageId_decorators;
    let _parentMessageId_initializers = [];
    let _parentMessageId_extraInitializers = [];
    return _a = class MessageResponseDto {
            constructor() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.content = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _content_initializers, void 0));
                this.sender = (__runInitializers(this, _content_extraInitializers), __runInitializers(this, _sender_initializers, void 0));
                this.timestamp = (__runInitializers(this, _sender_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0));
                this.metadata = (__runInitializers(this, _timestamp_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
                this.attachments = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _attachments_initializers, void 0));
                this.parentMessageId = (__runInitializers(this, _attachments_extraInitializers), __runInitializers(this, _parentMessageId_initializers, void 0));
                __runInitializers(this, _parentMessageId_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty()];
            _content_decorators = [ApiProperty()];
            _sender_decorators = [ApiProperty()];
            _timestamp_decorators = [ApiProperty()];
            _metadata_decorators = [ApiProperty({ required: false })];
            _attachments_decorators = [ApiProperty({ required: false })];
            _parentMessageId_decorators = [ApiProperty({ required: false })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _content_decorators, { kind: "field", name: "content", static: false, private: false, access: { has: obj => "content" in obj, get: obj => obj.content, set: (obj, value) => { obj.content = value; } }, metadata: _metadata }, _content_initializers, _content_extraInitializers);
            __esDecorate(null, null, _sender_decorators, { kind: "field", name: "sender", static: false, private: false, access: { has: obj => "sender" in obj, get: obj => obj.sender, set: (obj, value) => { obj.sender = value; } }, metadata: _metadata }, _sender_initializers, _sender_extraInitializers);
            __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: obj => "timestamp" in obj, get: obj => obj.timestamp, set: (obj, value) => { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
            __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
            __esDecorate(null, null, _attachments_decorators, { kind: "field", name: "attachments", static: false, private: false, access: { has: obj => "attachments" in obj, get: obj => obj.attachments, set: (obj, value) => { obj.attachments = value; } }, metadata: _metadata }, _attachments_initializers, _attachments_extraInitializers);
            __esDecorate(null, null, _parentMessageId_decorators, { kind: "field", name: "parentMessageId", static: false, private: false, access: { has: obj => "parentMessageId" in obj, get: obj => obj.parentMessageId, set: (obj, value) => { obj.parentMessageId = value; } }, metadata: _metadata }, _parentMessageId_initializers, _parentMessageId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { MessageResponseDto };
