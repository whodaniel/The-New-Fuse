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
import { AgentType } from '../dtos/agent.dto.js';
import { Message } from './message.entity.js';
import { WorkflowStep } from './workflow-step.entity.js';
let Agent = (() => {
    let _classDecorators = [Entity('agents')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _config_decorators;
    let _config_initializers = [];
    let _config_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _instanceId_decorators;
    let _instanceId_initializers = [];
    let _instanceId_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    let _owner_decorators;
    let _owner_initializers = [];
    let _owner_extraInitializers = [];
    let _messages_decorators;
    let _messages_initializers = [];
    let _messages_extraInitializers = [];
    let _workflowSteps_decorators;
    let _workflowSteps_initializers = [];
    let _workflowSteps_extraInitializers = [];
    let _capabilities_decorators;
    let _capabilities_initializers = [];
    let _capabilities_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _lastActiveAt_decorators;
    let _lastActiveAt_initializers = [];
    let _lastActiveAt_extraInitializers = [];
    var Agent = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.type = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _type_initializers, void 0));
            this.config = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _config_initializers, void 0));
            this.description = (__runInitializers(this, _config_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.instanceId = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _instanceId_initializers, void 0));
            this.isActive = (__runInitializers(this, _instanceId_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.owner = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _owner_initializers, void 0));
            this.messages = (__runInitializers(this, _owner_extraInitializers), __runInitializers(this, _messages_initializers, void 0));
            this.workflowSteps = (__runInitializers(this, _messages_extraInitializers), __runInitializers(this, _workflowSteps_initializers, void 0));
            this.capabilities = (__runInitializers(this, _workflowSteps_extraInitializers), __runInitializers(this, _capabilities_initializers, void 0));
            this.metadata = (__runInitializers(this, _capabilities_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.createdAt = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.lastActiveAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _lastActiveAt_initializers, void 0));
            __runInitializers(this, _lastActiveAt_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Agent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [PrimaryGeneratedColumn('uuid')];
        _name_decorators = [Column()];
        _type_decorators = [Column({
                type: 'enum',
                enum: AgentType,
            })];
        _config_decorators = [Column({ type: 'jsonb', nullable: true })];
        _description_decorators = [Column({ nullable: true })];
        _instanceId_decorators = [Column({ nullable: true })];
        _isActive_decorators = [Column({ default: true })];
        _owner_decorators = [ManyToOne(() => User, (user) => user.agents)];
        _messages_decorators = [OneToMany(() => Message, (message) => message.agent)];
        _workflowSteps_decorators = [OneToMany(() => WorkflowStep, (step) => step.agent)];
        _capabilities_decorators = [Column({ type: 'jsonb', nullable: true })];
        _metadata_decorators = [Column({ type: 'jsonb', nullable: true })];
        _createdAt_decorators = [CreateDateColumn()];
        _updatedAt_decorators = [UpdateDateColumn()];
        _lastActiveAt_decorators = [Column({ nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _config_decorators, { kind: "field", name: "config", static: false, private: false, access: { has: obj => "config" in obj, get: obj => obj.config, set: (obj, value) => { obj.config = value; } }, metadata: _metadata }, _config_initializers, _config_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _instanceId_decorators, { kind: "field", name: "instanceId", static: false, private: false, access: { has: obj => "instanceId" in obj, get: obj => obj.instanceId, set: (obj, value) => { obj.instanceId = value; } }, metadata: _metadata }, _instanceId_initializers, _instanceId_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _owner_decorators, { kind: "field", name: "owner", static: false, private: false, access: { has: obj => "owner" in obj, get: obj => obj.owner, set: (obj, value) => { obj.owner = value; } }, metadata: _metadata }, _owner_initializers, _owner_extraInitializers);
        __esDecorate(null, null, _messages_decorators, { kind: "field", name: "messages", static: false, private: false, access: { has: obj => "messages" in obj, get: obj => obj.messages, set: (obj, value) => { obj.messages = value; } }, metadata: _metadata }, _messages_initializers, _messages_extraInitializers);
        __esDecorate(null, null, _workflowSteps_decorators, { kind: "field", name: "workflowSteps", static: false, private: false, access: { has: obj => "workflowSteps" in obj, get: obj => obj.workflowSteps, set: (obj, value) => { obj.workflowSteps = value; } }, metadata: _metadata }, _workflowSteps_initializers, _workflowSteps_extraInitializers);
        __esDecorate(null, null, _capabilities_decorators, { kind: "field", name: "capabilities", static: false, private: false, access: { has: obj => "capabilities" in obj, get: obj => obj.capabilities, set: (obj, value) => { obj.capabilities = value; } }, metadata: _metadata }, _capabilities_initializers, _capabilities_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _lastActiveAt_decorators, { kind: "field", name: "lastActiveAt", static: false, private: false, access: { has: obj => "lastActiveAt" in obj, get: obj => obj.lastActiveAt, set: (obj, value) => { obj.lastActiveAt = value; } }, metadata: _metadata }, _lastActiveAt_initializers, _lastActiveAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Agent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Agent = _classThis;
})();
export { Agent };
