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
import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard.js';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
let AuthController = (() => {
    let _classDecorators = [ApiTags('auth'), Controller('auth')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _login_decorators;
    let _register_decorators;
    let _refresh_decorators;
    let _logout_decorators;
    let _me_decorators;
    var AuthController = _classThis = class {
        constructor(authService) {
            this.authService = (__runInitializers(this, _instanceExtraInitializers), authService);
        }
        async login(loginDto) {
            return this.authService.login(loginDto);
        }
        async register(registerDto) {
            return this.authService.register(registerDto);
        }
        async refresh(refreshToken) {
            return this.authService.refresh(refreshToken);
        }
        async logout() {
            return this.authService.logout();
        }
        async me() {
            return this.authService.getCurrentUser();
        }
    };
    __setFunctionName(_classThis, "AuthController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _login_decorators = [Post('login'), ApiOperation({ summary: 'User login' }), ApiResponse({ status: 200, description: 'Login successful' })];
        _register_decorators = [Post('register'), ApiOperation({ summary: 'User registration' }), ApiResponse({ status: 201, description: 'Registration successful' })];
        _refresh_decorators = [Post('refresh'), ApiOperation({ summary: 'Refresh token' }), ApiResponse({ status: 200, description: 'Token refreshed successfully' })];
        _logout_decorators = [Post('logout'), UseGuards(AuthGuard), ApiOperation({ summary: 'User logout' }), ApiResponse({ status: 200, description: 'Logout successful' })];
        _me_decorators = [Get('me'), UseGuards(AuthGuard), ApiOperation({ summary: 'Get current user' }), ApiResponse({ status: 200, description: 'Return current user' })];
        __esDecorate(_classThis, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: obj => "login" in obj, get: obj => obj.login }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _register_decorators, { kind: "method", name: "register", static: false, private: false, access: { has: obj => "register" in obj, get: obj => obj.register }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _refresh_decorators, { kind: "method", name: "refresh", static: false, private: false, access: { has: obj => "refresh" in obj, get: obj => obj.refresh }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _logout_decorators, { kind: "method", name: "logout", static: false, private: false, access: { has: obj => "logout" in obj, get: obj => obj.logout }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _me_decorators, { kind: "method", name: "me", static: false, private: false, access: { has: obj => "me" in obj, get: obj => obj.me }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthController = _classThis;
})();
export { AuthController };
