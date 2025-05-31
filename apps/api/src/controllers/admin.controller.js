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
import { Controller, Post, Get, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard.js';
import { execSync } from 'child_process';
let AdminController = (() => {
    let _classDecorators = [Controller('admin'), UseGuards(AdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _runScript_decorators;
    let _getRoles_decorators;
    let _updateRolePermissions_decorators;
    let _getAuditLogs_decorators;
    let _getSystemMetrics_decorators;
    var AdminController = _classThis = class {
        async runScript(script) {
            try {
                const output = execSync(`yarn fuse ${script}`, { encoding: 'utf-8' });
                return { success: true, output };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        }
        async getRoles() {
            return this.roleService.getAllRoles();
        }
        async updateRolePermissions(roleId, permissions) {
            return this.roleService.updateRolePermissions(roleId, permissions);
        }
        async getAuditLogs() {
            return this.auditService.getLogs();
        }
        async getSystemMetrics() {
            return this.metricsService.getSystemMetrics();
        }
        constructor() {
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    __setFunctionName(_classThis, "AdminController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _runScript_decorators = [Post('run-script')];
        _getRoles_decorators = [Get('roles')];
        _updateRolePermissions_decorators = [Put('roles/:roleId/permissions')];
        _getAuditLogs_decorators = [Get('audit-logs')];
        _getSystemMetrics_decorators = [Get('metrics')];
        __esDecorate(_classThis, null, _runScript_decorators, { kind: "method", name: "runScript", static: false, private: false, access: { has: obj => "runScript" in obj, get: obj => obj.runScript }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRoles_decorators, { kind: "method", name: "getRoles", static: false, private: false, access: { has: obj => "getRoles" in obj, get: obj => obj.getRoles }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateRolePermissions_decorators, { kind: "method", name: "updateRolePermissions", static: false, private: false, access: { has: obj => "updateRolePermissions" in obj, get: obj => obj.updateRolePermissions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAuditLogs_decorators, { kind: "method", name: "getAuditLogs", static: false, private: false, access: { has: obj => "getAuditLogs" in obj, get: obj => obj.getAuditLogs }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSystemMetrics_decorators, { kind: "method", name: "getSystemMetrics", static: false, private: false, access: { has: obj => "getSystemMetrics" in obj, get: obj => obj.getSystemMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminController = _classThis;
})();
export { AdminController };
