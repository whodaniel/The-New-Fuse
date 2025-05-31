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
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Agent } from './Agent.js';
import { Pipeline } from './Pipeline.js';
import { AuthSession } from './AuthSession.js';
import { LoginAttempt } from './LoginAttempt.js';
import { AuthEvent } from './AuthEvent.js';
let User = (() => {
    let _classDecorators = [Entity('users')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _hashedPassword_decorators;
    let _hashedPassword_initializers = [];
    let _hashedPassword_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _role_decorators;
    let _role_initializers = [];
    let _role_extraInitializers = [];
    let _refreshToken_decorators;
    let _refreshToken_initializers = [];
    let _refreshToken_extraInitializers = [];
    let _agents_decorators;
    let _agents_initializers = [];
    let _agents_extraInitializers = [];
    let _pipelines_decorators;
    let _pipelines_initializers = [];
    let _pipelines_extraInitializers = [];
    let _authSessions_decorators;
    let _authSessions_initializers = [];
    let _authSessions_extraInitializers = [];
    let _loginAttempts_decorators;
    let _loginAttempts_initializers = [];
    let _loginAttempts_extraInitializers = [];
    let _authEvents_decorators;
    let _authEvents_initializers = [];
    let _authEvents_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _deletedAt_decorators;
    let _deletedAt_initializers = [];
    let _deletedAt_extraInitializers = [];
    var User = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.email = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            this.hashedPassword = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _hashedPassword_initializers, void 0));
            this.name = (__runInitializers(this, _hashedPassword_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.role = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _role_initializers, void 0));
            this.refreshToken = (__runInitializers(this, _role_extraInitializers), __runInitializers(this, _refreshToken_initializers, void 0));
            this.agents = (__runInitializers(this, _refreshToken_extraInitializers), __runInitializers(this, _agents_initializers, void 0));
            this.pipelines = (__runInitializers(this, _agents_extraInitializers), __runInitializers(this, _pipelines_initializers, void 0));
            this.authSessions = (__runInitializers(this, _pipelines_extraInitializers), __runInitializers(this, _authSessions_initializers, void 0));
            this.loginAttempts = (__runInitializers(this, _authSessions_extraInitializers), __runInitializers(this, _loginAttempts_initializers, void 0));
            this.authEvents = (__runInitializers(this, _loginAttempts_extraInitializers), __runInitializers(this, _authEvents_initializers, void 0));
            this.createdAt = (__runInitializers(this, _authEvents_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.deletedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _deletedAt_initializers, void 0));
            __runInitializers(this, _deletedAt_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "User");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [PrimaryGeneratedColumn('uuid')];
        _email_decorators = [Column({ type: 'varchar', length: 255, unique: true })];
        _hashedPassword_decorators = [Column(), Exclude()];
        _name_decorators = [Column({ type: 'varchar', length: 100, nullable: true })];
        _role_decorators = [Column({ type: 'varchar', length: 50, default: 'user' })];
        _refreshToken_decorators = [Column({ type: 'varchar', length: 500, nullable: true })];
        _agents_decorators = [OneToMany(() => Agent, agent => agent.user)];
        _pipelines_decorators = [OneToMany(() => Pipeline, pipeline => pipeline.user)];
        _authSessions_decorators = [OneToMany(() => AuthSession, session => session.user)];
        _loginAttempts_decorators = [OneToMany(() => LoginAttempt, attempt => attempt.user)];
        _authEvents_decorators = [OneToMany(() => AuthEvent, event => event.user)];
        _createdAt_decorators = [CreateDateColumn()];
        _updatedAt_decorators = [UpdateDateColumn()];
        _deletedAt_decorators = [DeleteDateColumn()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _hashedPassword_decorators, { kind: "field", name: "hashedPassword", static: false, private: false, access: { has: obj => "hashedPassword" in obj, get: obj => obj.hashedPassword, set: (obj, value) => { obj.hashedPassword = value; } }, metadata: _metadata }, _hashedPassword_initializers, _hashedPassword_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: obj => "role" in obj, get: obj => obj.role, set: (obj, value) => { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
        __esDecorate(null, null, _refreshToken_decorators, { kind: "field", name: "refreshToken", static: false, private: false, access: { has: obj => "refreshToken" in obj, get: obj => obj.refreshToken, set: (obj, value) => { obj.refreshToken = value; } }, metadata: _metadata }, _refreshToken_initializers, _refreshToken_extraInitializers);
        __esDecorate(null, null, _agents_decorators, { kind: "field", name: "agents", static: false, private: false, access: { has: obj => "agents" in obj, get: obj => obj.agents, set: (obj, value) => { obj.agents = value; } }, metadata: _metadata }, _agents_initializers, _agents_extraInitializers);
        __esDecorate(null, null, _pipelines_decorators, { kind: "field", name: "pipelines", static: false, private: false, access: { has: obj => "pipelines" in obj, get: obj => obj.pipelines, set: (obj, value) => { obj.pipelines = value; } }, metadata: _metadata }, _pipelines_initializers, _pipelines_extraInitializers);
        __esDecorate(null, null, _authSessions_decorators, { kind: "field", name: "authSessions", static: false, private: false, access: { has: obj => "authSessions" in obj, get: obj => obj.authSessions, set: (obj, value) => { obj.authSessions = value; } }, metadata: _metadata }, _authSessions_initializers, _authSessions_extraInitializers);
        __esDecorate(null, null, _loginAttempts_decorators, { kind: "field", name: "loginAttempts", static: false, private: false, access: { has: obj => "loginAttempts" in obj, get: obj => obj.loginAttempts, set: (obj, value) => { obj.loginAttempts = value; } }, metadata: _metadata }, _loginAttempts_initializers, _loginAttempts_extraInitializers);
        __esDecorate(null, null, _authEvents_decorators, { kind: "field", name: "authEvents", static: false, private: false, access: { has: obj => "authEvents" in obj, get: obj => obj.authEvents, set: (obj, value) => { obj.authEvents = value; } }, metadata: _metadata }, _authEvents_initializers, _authEvents_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _deletedAt_decorators, { kind: "field", name: "deletedAt", static: false, private: false, access: { has: obj => "deletedAt" in obj, get: obj => obj.deletedAt, set: (obj, value) => { obj.deletedAt = value; } }, metadata: _metadata }, _deletedAt_initializers, _deletedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
})();
export { User };
