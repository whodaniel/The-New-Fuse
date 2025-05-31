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
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
let AuthService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuthService = _classThis = class {
        constructor(jwtService, userService, configService) {
            this.jwtService = jwtService;
            this.userService = userService;
            this.configService = configService;
        }
        async login(loginDto) {
            const user = await this.userService.findByEmail(loginDto.email);
            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }
            const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials');
            }
            const tokens = await this.generateTokens(user);
            if (loginDto.rememberMe) {
                await this.userService.saveRefreshToken(user.id, tokens.refreshToken);
            }
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    roles: user.roles,
                },
            };
        }
        async refreshToken(refreshToken) {
            try {
                const decoded = this.jwtService.verify(refreshToken, {
                    secret: this.configService.get('JWT_REFRESH_SECRET'),
                });
                const user = await this.userService.findById(decoded.sub);
                if (!user) {
                    throw new UnauthorizedException('Invalid refresh token');
                }
                const tokens = await this.generateTokens(user);
                await this.userService.saveRefreshToken(user.id, tokens.refreshToken);
                return {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        roles: user.roles,
                    },
                };
            }
            catch (_error) {
                throw new UnauthorizedException('Invalid refresh token');
            }
        }
        async requestPasswordReset(email) {
            const user = await this.userService.findByEmail(email);
            if (user) {
                const resetToken = await this.generatePasswordResetToken(user);
                // Send email with reset token
                await this.sendPasswordResetEmail(user.email, resetToken);
            }
            // Always return success to prevent email enumeration
            return { message: 'If the email exists, a reset link has been sent' };
        }
        async generateTokens(user) {
            const [accessToken, refreshToken] = await Promise.all([
                this.jwtService.signAsync({
                    sub: user.id,
                    email: user.email,
                    roles: user.roles,
                }, {
                    secret: this.configService.get('JWT_ACCESS_SECRET'),
                    expiresIn: '15m',
                }),
                this.jwtService.signAsync({
                    sub: user.id,
                }, {
                    secret: this.configService.get('JWT_REFRESH_SECRET'),
                    expiresIn: '7d',
                }),
            ]);
            return {
                accessToken,
                refreshToken,
            };
        }
        async generatePasswordResetToken(user) {
            return this.jwtService.signAsync({
                sub: user.id,
                type: 'password-reset',
            }, {
                secret: this.configService.get('JWT_RESET_SECRET'),
                expiresIn: '1h',
            });
        }
        async sendPasswordResetEmail(email, token) {
            // Implement email sending logic here
        }
        async validateResetToken(_email, _token) {
            // Implement token validation logic here
            return true;
        }
    };
    __setFunctionName(_classThis, "AuthService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthService = _classThis;
})();
export { AuthService };
