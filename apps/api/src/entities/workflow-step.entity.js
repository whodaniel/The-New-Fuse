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
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, } from 'typeorm';
import { Workflow } from './workflow.entity.js';
import { Agent } from './agent.entity.js';
let WorkflowStep = (() => {
    let _classDecorators = [Entity('workflow_steps')];
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
    let _workflow_decorators;
    let _workflow_initializers = [];
    let _workflow_extraInitializers = [];
    let _agent_decorators;
    let _agent_initializers = [];
    let _agent_extraInitializers = [];
    let _nextSteps_decorators;
    let _nextSteps_initializers = [];
    let _nextSteps_extraInitializers = [];
    let _conditions_decorators;
    let _conditions_initializers = [];
    let _conditions_extraInitializers = [];
    let _transformations_decorators;
    let _transformations_initializers = [];
    let _transformations_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _lastExecutedAt_decorators;
    let _lastExecutedAt_initializers = [];
    let _lastExecutedAt_extraInitializers = [];
    let _statistics_decorators;
    let _statistics_initializers = [];
    let _statistics_extraInitializers = [];
    var WorkflowStep = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.type = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _type_initializers, void 0));
            this.config = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _config_initializers, void 0));
            this.workflow = (__runInitializers(this, _config_extraInitializers), __runInitializers(this, _workflow_initializers, void 0));
            this.agent = (__runInitializers(this, _workflow_extraInitializers), __runInitializers(this, _agent_initializers, void 0));
            this.nextSteps = (__runInitializers(this, _agent_extraInitializers), __runInitializers(this, _nextSteps_initializers, void 0));
            this.conditions = (__runInitializers(this, _nextSteps_extraInitializers), __runInitializers(this, _conditions_initializers, void 0));
            this.transformations = (__runInitializers(this, _conditions_extraInitializers), __runInitializers(this, _transformations_initializers, void 0));
            this.metadata = (__runInitializers(this, _transformations_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.isActive = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.createdAt = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.lastExecutedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _lastExecutedAt_initializers, void 0));
            this.statistics = (__runInitializers(this, _lastExecutedAt_extraInitializers), __runInitializers(this, _statistics_initializers, void 0));
            __runInitializers(this, _statistics_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "WorkflowStep");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [PrimaryGeneratedColumn('uuid')];
        _name_decorators = [Column()];
        _type_decorators = [Column()];
        _config_decorators = [Column({ type: 'jsonb' })];
        _workflow_decorators = [ManyToOne(() => Workflow, (workflow) => workflow.steps)];
        _agent_decorators = [ManyToOne(() => Agent, (agent) => agent.workflowSteps, { nullable: true })];
        _nextSteps_decorators = [Column('simple-array')];
        _conditions_decorators = [Column({ type: 'jsonb', nullable: true })];
        _transformations_decorators = [Column({ type: 'jsonb', nullable: true })];
        _metadata_decorators = [Column({ type: 'jsonb', nullable: true })];
        _isActive_decorators = [Column({ default: true })];
        _createdAt_decorators = [CreateDateColumn()];
        _updatedAt_decorators = [UpdateDateColumn()];
        _lastExecutedAt_decorators = [Column({ nullable: true })];
        _statistics_decorators = [Column({ type: 'jsonb', nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _config_decorators, { kind: "field", name: "config", static: false, private: false, access: { has: obj => "config" in obj, get: obj => obj.config, set: (obj, value) => { obj.config = value; } }, metadata: _metadata }, _config_initializers, _config_extraInitializers);
        __esDecorate(null, null, _workflow_decorators, { kind: "field", name: "workflow", static: false, private: false, access: { has: obj => "workflow" in obj, get: obj => obj.workflow, set: (obj, value) => { obj.workflow = value; } }, metadata: _metadata }, _workflow_initializers, _workflow_extraInitializers);
        __esDecorate(null, null, _agent_decorators, { kind: "field", name: "agent", static: false, private: false, access: { has: obj => "agent" in obj, get: obj => obj.agent, set: (obj, value) => { obj.agent = value; } }, metadata: _metadata }, _agent_initializers, _agent_extraInitializers);
        __esDecorate(null, null, _nextSteps_decorators, { kind: "field", name: "nextSteps", static: false, private: false, access: { has: obj => "nextSteps" in obj, get: obj => obj.nextSteps, set: (obj, value) => { obj.nextSteps = value; } }, metadata: _metadata }, _nextSteps_initializers, _nextSteps_extraInitializers);
        __esDecorate(null, null, _conditions_decorators, { kind: "field", name: "conditions", static: false, private: false, access: { has: obj => "conditions" in obj, get: obj => obj.conditions, set: (obj, value) => { obj.conditions = value; } }, metadata: _metadata }, _conditions_initializers, _conditions_extraInitializers);
        __esDecorate(null, null, _transformations_decorators, { kind: "field", name: "transformations", static: false, private: false, access: { has: obj => "transformations" in obj, get: obj => obj.transformations, set: (obj, value) => { obj.transformations = value; } }, metadata: _metadata }, _transformations_initializers, _transformations_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _lastExecutedAt_decorators, { kind: "field", name: "lastExecutedAt", static: false, private: false, access: { has: obj => "lastExecutedAt" in obj, get: obj => obj.lastExecutedAt, set: (obj, value) => { obj.lastExecutedAt = value; } }, metadata: _metadata }, _lastExecutedAt_initializers, _lastExecutedAt_extraInitializers);
        __esDecorate(null, null, _statistics_decorators, { kind: "field", name: "statistics", static: false, private: false, access: { has: obj => "statistics" in obj, get: obj => obj.statistics, set: (obj, value) => { obj.statistics = value; } }, metadata: _metadata }, _statistics_initializers, _statistics_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WorkflowStep = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WorkflowStep = _classThis;
})();
export { WorkflowStep };
