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
import { WorkflowStep } from './workflow-step.entity.js';
let Workflow = (() => {
    let _classDecorators = [Entity('workflows')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _creator_decorators;
    let _creator_initializers = [];
    let _creator_extraInitializers = [];
    let _steps_decorators;
    let _steps_initializers = [];
    let _steps_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    let _variables_decorators;
    let _variables_initializers = [];
    let _variables_extraInitializers = [];
    let _triggers_decorators;
    let _triggers_initializers = [];
    let _triggers_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _lastExecutedAt_decorators;
    let _lastExecutedAt_initializers = [];
    let _lastExecutedAt_extraInitializers = [];
    let _executionCount_decorators;
    let _executionCount_initializers = [];
    let _executionCount_extraInitializers = [];
    let _statistics_decorators;
    let _statistics_initializers = [];
    let _statistics_extraInitializers = [];
    var Workflow = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.creator = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _creator_initializers, void 0));
            this.steps = (__runInitializers(this, _creator_extraInitializers), __runInitializers(this, _steps_initializers, void 0));
            this.metadata = (__runInitializers(this, _steps_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.isActive = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.variables = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _variables_initializers, void 0));
            this.triggers = (__runInitializers(this, _variables_extraInitializers), __runInitializers(this, _triggers_initializers, void 0));
            this.createdAt = (__runInitializers(this, _triggers_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.lastExecutedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _lastExecutedAt_initializers, void 0));
            this.executionCount = (__runInitializers(this, _lastExecutedAt_extraInitializers), __runInitializers(this, _executionCount_initializers, void 0));
            this.statistics = (__runInitializers(this, _executionCount_extraInitializers), __runInitializers(this, _statistics_initializers, void 0));
            __runInitializers(this, _statistics_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Workflow");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [PrimaryGeneratedColumn('uuid')];
        _name_decorators = [Column()];
        _description_decorators = [Column({ nullable: true })];
        _creator_decorators = [ManyToOne(() => User, (user) => user.workflows)];
        _steps_decorators = [OneToMany(() => WorkflowStep, (step) => step.workflow, {
                cascade: true,
            })];
        _metadata_decorators = [Column({ type: 'jsonb', nullable: true })];
        _isActive_decorators = [Column({ default: true })];
        _variables_decorators = [Column({ type: 'jsonb', nullable: true })];
        _triggers_decorators = [Column({ type: 'jsonb', nullable: true })];
        _createdAt_decorators = [CreateDateColumn()];
        _updatedAt_decorators = [UpdateDateColumn()];
        _lastExecutedAt_decorators = [Column({ nullable: true })];
        _executionCount_decorators = [Column({ default: 0 })];
        _statistics_decorators = [Column({ type: 'jsonb', nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _creator_decorators, { kind: "field", name: "creator", static: false, private: false, access: { has: obj => "creator" in obj, get: obj => obj.creator, set: (obj, value) => { obj.creator = value; } }, metadata: _metadata }, _creator_initializers, _creator_extraInitializers);
        __esDecorate(null, null, _steps_decorators, { kind: "field", name: "steps", static: false, private: false, access: { has: obj => "steps" in obj, get: obj => obj.steps, set: (obj, value) => { obj.steps = value; } }, metadata: _metadata }, _steps_initializers, _steps_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _variables_decorators, { kind: "field", name: "variables", static: false, private: false, access: { has: obj => "variables" in obj, get: obj => obj.variables, set: (obj, value) => { obj.variables = value; } }, metadata: _metadata }, _variables_initializers, _variables_extraInitializers);
        __esDecorate(null, null, _triggers_decorators, { kind: "field", name: "triggers", static: false, private: false, access: { has: obj => "triggers" in obj, get: obj => obj.triggers, set: (obj, value) => { obj.triggers = value; } }, metadata: _metadata }, _triggers_initializers, _triggers_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _lastExecutedAt_decorators, { kind: "field", name: "lastExecutedAt", static: false, private: false, access: { has: obj => "lastExecutedAt" in obj, get: obj => obj.lastExecutedAt, set: (obj, value) => { obj.lastExecutedAt = value; } }, metadata: _metadata }, _lastExecutedAt_initializers, _lastExecutedAt_extraInitializers);
        __esDecorate(null, null, _executionCount_decorators, { kind: "field", name: "executionCount", static: false, private: false, access: { has: obj => "executionCount" in obj, get: obj => obj.executionCount, set: (obj, value) => { obj.executionCount = value; } }, metadata: _metadata }, _executionCount_initializers, _executionCount_extraInitializers);
        __esDecorate(null, null, _statistics_decorators, { kind: "field", name: "statistics", static: false, private: false, access: { has: obj => "statistics" in obj, get: obj => obj.statistics, set: (obj, value) => { obj.statistics = value; } }, metadata: _metadata }, _statistics_initializers, _statistics_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Workflow = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Workflow = _classThis;
})();
export { Workflow };
