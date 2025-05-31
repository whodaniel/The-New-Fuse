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
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, } from 'typeorm';
import { Agent } from './agent.entity.js';
import { ChatRoom } from './chat-room.entity.js';
import { Message } from './message.entity.js';
import { Workflow } from './workflow.entity.js';
let User = (() => {
    let _classDecorators = [Entity('users')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _username_decorators;
    let _username_initializers = [];
    let _username_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    let _firstName_decorators;
    let _firstName_initializers = [];
    let _firstName_extraInitializers = [];
    let _lastName_decorators;
    let _lastName_initializers = [];
    let _lastName_extraInitializers = [];
    let _roles_decorators;
    let _roles_initializers = [];
    let _roles_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    let _lastLoginAt_decorators;
    let _lastLoginAt_initializers = [];
    let _lastLoginAt_extraInitializers = [];
    let _agents_decorators;
    let _agents_initializers = [];
    let _agents_extraInitializers = [];
    let _chatRooms_decorators;
    let _chatRooms_initializers = [];
    let _chatRooms_extraInitializers = [];
    let _messages_decorators;
    let _messages_initializers = [];
    let _messages_extraInitializers = [];
    let _workflows_decorators;
    let _workflows_initializers = [];
    let _workflows_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _preferences_decorators;
    let _preferences_initializers = [];
    let _preferences_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    var User = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.username = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _username_initializers, void 0));
            this.email = (__runInitializers(this, _username_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            this.password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
            this.firstName = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _firstName_initializers, void 0));
            this.lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
            this.roles = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _roles_initializers, void 0));
            this.isActive = (__runInitializers(this, _roles_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.lastLoginAt = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _lastLoginAt_initializers, void 0));
            this.agents = (__runInitializers(this, _lastLoginAt_extraInitializers), __runInitializers(this, _agents_initializers, void 0));
            this.chatRooms = (__runInitializers(this, _agents_extraInitializers), __runInitializers(this, _chatRooms_initializers, void 0));
            this.messages = (__runInitializers(this, _chatRooms_extraInitializers), __runInitializers(this, _messages_initializers, void 0));
            this.workflows = (__runInitializers(this, _messages_extraInitializers), __runInitializers(this, _workflows_initializers, void 0));
            this.createdAt = (__runInitializers(this, _workflows_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.preferences = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _preferences_initializers, void 0));
            this.metadata = (__runInitializers(this, _preferences_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            __runInitializers(this, _metadata_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "User");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [PrimaryGeneratedColumn('uuid')];
        _username_decorators = [Column({ unique: true })];
        _email_decorators = [Column({ unique: true })];
        _password_decorators = [Column()];
        _firstName_decorators = [Column({ nullable: true })];
        _lastName_decorators = [Column({ nullable: true })];
        _roles_decorators = [Column('simple-array')];
        _isActive_decorators = [Column({ default: true })];
        _lastLoginAt_decorators = [Column({ nullable: true })];
        _agents_decorators = [OneToMany(() => Agent, (agent) => agent.owner)];
        _chatRooms_decorators = [OneToMany(() => ChatRoom, (chatRoom) => chatRoom.owner)];
        _messages_decorators = [OneToMany(() => Message, (message) => message.sender)];
        _workflows_decorators = [OneToMany(() => Workflow, (workflow) => workflow.creator)];
        _createdAt_decorators = [CreateDateColumn()];
        _updatedAt_decorators = [UpdateDateColumn()];
        _preferences_decorators = [Column({ type: 'jsonb', nullable: true })];
        _metadata_decorators = [Column({ type: 'jsonb', nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _username_decorators, { kind: "field", name: "username", static: false, private: false, access: { has: obj => "username" in obj, get: obj => obj.username, set: (obj, value) => { obj.username = value; } }, metadata: _metadata }, _username_initializers, _username_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
        __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: obj => "firstName" in obj, get: obj => obj.firstName, set: (obj, value) => { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
        __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: obj => "lastName" in obj, get: obj => obj.lastName, set: (obj, value) => { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
        __esDecorate(null, null, _roles_decorators, { kind: "field", name: "roles", static: false, private: false, access: { has: obj => "roles" in obj, get: obj => obj.roles, set: (obj, value) => { obj.roles = value; } }, metadata: _metadata }, _roles_initializers, _roles_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _lastLoginAt_decorators, { kind: "field", name: "lastLoginAt", static: false, private: false, access: { has: obj => "lastLoginAt" in obj, get: obj => obj.lastLoginAt, set: (obj, value) => { obj.lastLoginAt = value; } }, metadata: _metadata }, _lastLoginAt_initializers, _lastLoginAt_extraInitializers);
        __esDecorate(null, null, _agents_decorators, { kind: "field", name: "agents", static: false, private: false, access: { has: obj => "agents" in obj, get: obj => obj.agents, set: (obj, value) => { obj.agents = value; } }, metadata: _metadata }, _agents_initializers, _agents_extraInitializers);
        __esDecorate(null, null, _chatRooms_decorators, { kind: "field", name: "chatRooms", static: false, private: false, access: { has: obj => "chatRooms" in obj, get: obj => obj.chatRooms, set: (obj, value) => { obj.chatRooms = value; } }, metadata: _metadata }, _chatRooms_initializers, _chatRooms_extraInitializers);
        __esDecorate(null, null, _messages_decorators, { kind: "field", name: "messages", static: false, private: false, access: { has: obj => "messages" in obj, get: obj => obj.messages, set: (obj, value) => { obj.messages = value; } }, metadata: _metadata }, _messages_initializers, _messages_extraInitializers);
        __esDecorate(null, null, _workflows_decorators, { kind: "field", name: "workflows", static: false, private: false, access: { has: obj => "workflows" in obj, get: obj => obj.workflows, set: (obj, value) => { obj.workflows = value; } }, metadata: _metadata }, _workflows_initializers, _workflows_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _preferences_decorators, { kind: "field", name: "preferences", static: false, private: false, access: { has: obj => "preferences" in obj, get: obj => obj.preferences, set: (obj, value) => { obj.preferences = value; } }, metadata: _metadata }, _preferences_initializers, _preferences_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
})();
export { User };
