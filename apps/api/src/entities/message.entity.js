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
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, } from 'typeorm';
import { User } from './user.entity.js';
import { ChatRoom } from './chat-room.entity.js';
import { Agent } from './agent.entity.js';
let Message = (() => {
    let _classDecorators = [Entity('messages')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _content_decorators;
    let _content_initializers = [];
    let _content_extraInitializers = [];
    let _sender_decorators;
    let _sender_initializers = [];
    let _sender_extraInitializers = [];
    let _agent_decorators;
    let _agent_initializers = [];
    let _agent_extraInitializers = [];
    let _room_decorators;
    let _room_initializers = [];
    let _room_extraInitializers = [];
    let _parentMessage_decorators;
    let _parentMessage_initializers = [];
    let _parentMessage_extraInitializers = [];
    let _replies_decorators;
    let _replies_initializers = [];
    let _replies_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _attachments_decorators;
    let _attachments_initializers = [];
    let _attachments_extraInitializers = [];
    let _timestamp_decorators;
    let _timestamp_initializers = [];
    let _timestamp_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _isEdited_decorators;
    let _isEdited_initializers = [];
    let _isEdited_extraInitializers = [];
    let _isDeleted_decorators;
    let _isDeleted_initializers = [];
    let _isDeleted_extraInitializers = [];
    let _reactions_decorators;
    let _reactions_initializers = [];
    let _reactions_extraInitializers = [];
    var Message = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.content = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _content_initializers, void 0));
            this.sender = (__runInitializers(this, _content_extraInitializers), __runInitializers(this, _sender_initializers, void 0));
            this.agent = (__runInitializers(this, _sender_extraInitializers), __runInitializers(this, _agent_initializers, void 0));
            this.room = (__runInitializers(this, _agent_extraInitializers), __runInitializers(this, _room_initializers, void 0));
            this.parentMessage = (__runInitializers(this, _room_extraInitializers), __runInitializers(this, _parentMessage_initializers, void 0));
            this.replies = (__runInitializers(this, _parentMessage_extraInitializers), __runInitializers(this, _replies_initializers, void 0));
            this.metadata = (__runInitializers(this, _replies_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.attachments = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _attachments_initializers, void 0));
            this.timestamp = (__runInitializers(this, _attachments_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _timestamp_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.isEdited = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _isEdited_initializers, void 0));
            this.isDeleted = (__runInitializers(this, _isEdited_extraInitializers), __runInitializers(this, _isDeleted_initializers, void 0));
            this.reactions = (__runInitializers(this, _isDeleted_extraInitializers), __runInitializers(this, _reactions_initializers, void 0));
            __runInitializers(this, _reactions_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Message");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [PrimaryGeneratedColumn('uuid')];
        _content_decorators = [Column('text')];
        _sender_decorators = [ManyToOne(() => User, (user) => user.messages)];
        _agent_decorators = [ManyToOne(() => Agent, (agent) => agent.messages, { nullable: true })];
        _room_decorators = [ManyToOne(() => ChatRoom, (room) => room.messages)];
        _parentMessage_decorators = [ManyToOne(() => Message, (message) => message.replies, { nullable: true })];
        _replies_decorators = [OneToMany(() => Message, (message) => message.parentMessage)];
        _metadata_decorators = [Column({ type: 'jsonb', nullable: true })];
        _attachments_decorators = [Column('simple-array', { nullable: true })];
        _timestamp_decorators = [CreateDateColumn()];
        _updatedAt_decorators = [UpdateDateColumn()];
        _isEdited_decorators = [Column({ default: false })];
        _isDeleted_decorators = [Column({ default: false })];
        _reactions_decorators = [Column({ type: 'jsonb', nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _content_decorators, { kind: "field", name: "content", static: false, private: false, access: { has: obj => "content" in obj, get: obj => obj.content, set: (obj, value) => { obj.content = value; } }, metadata: _metadata }, _content_initializers, _content_extraInitializers);
        __esDecorate(null, null, _sender_decorators, { kind: "field", name: "sender", static: false, private: false, access: { has: obj => "sender" in obj, get: obj => obj.sender, set: (obj, value) => { obj.sender = value; } }, metadata: _metadata }, _sender_initializers, _sender_extraInitializers);
        __esDecorate(null, null, _agent_decorators, { kind: "field", name: "agent", static: false, private: false, access: { has: obj => "agent" in obj, get: obj => obj.agent, set: (obj, value) => { obj.agent = value; } }, metadata: _metadata }, _agent_initializers, _agent_extraInitializers);
        __esDecorate(null, null, _room_decorators, { kind: "field", name: "room", static: false, private: false, access: { has: obj => "room" in obj, get: obj => obj.room, set: (obj, value) => { obj.room = value; } }, metadata: _metadata }, _room_initializers, _room_extraInitializers);
        __esDecorate(null, null, _parentMessage_decorators, { kind: "field", name: "parentMessage", static: false, private: false, access: { has: obj => "parentMessage" in obj, get: obj => obj.parentMessage, set: (obj, value) => { obj.parentMessage = value; } }, metadata: _metadata }, _parentMessage_initializers, _parentMessage_extraInitializers);
        __esDecorate(null, null, _replies_decorators, { kind: "field", name: "replies", static: false, private: false, access: { has: obj => "replies" in obj, get: obj => obj.replies, set: (obj, value) => { obj.replies = value; } }, metadata: _metadata }, _replies_initializers, _replies_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _attachments_decorators, { kind: "field", name: "attachments", static: false, private: false, access: { has: obj => "attachments" in obj, get: obj => obj.attachments, set: (obj, value) => { obj.attachments = value; } }, metadata: _metadata }, _attachments_initializers, _attachments_extraInitializers);
        __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: obj => "timestamp" in obj, get: obj => obj.timestamp, set: (obj, value) => { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _isEdited_decorators, { kind: "field", name: "isEdited", static: false, private: false, access: { has: obj => "isEdited" in obj, get: obj => obj.isEdited, set: (obj, value) => { obj.isEdited = value; } }, metadata: _metadata }, _isEdited_initializers, _isEdited_extraInitializers);
        __esDecorate(null, null, _isDeleted_decorators, { kind: "field", name: "isDeleted", static: false, private: false, access: { has: obj => "isDeleted" in obj, get: obj => obj.isDeleted, set: (obj, value) => { obj.isDeleted = value; } }, metadata: _metadata }, _isDeleted_initializers, _isDeleted_extraInitializers);
        __esDecorate(null, null, _reactions_decorators, { kind: "field", name: "reactions", static: false, private: false, access: { has: obj => "reactions" in obj, get: obj => obj.reactions, set: (obj, value) => { obj.reactions = value; } }, metadata: _metadata }, _reactions_initializers, _reactions_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Message = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Message = _classThis;
})();
export { Message };
