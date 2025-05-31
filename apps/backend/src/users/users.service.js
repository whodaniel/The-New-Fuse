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
import { Injectable } from '@nestjs/common';
import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from './events/user.events.js';
import { hashPassword } from '../utils/auth.utils.js';
let UsersService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UsersService = _classThis = class {
        constructor(prisma, logger, eventBus) {
            this.prisma = prisma;
            this.logger = logger;
            this.eventBus = eventBus;
            this.logger.setContext('UsersService');
        }
        async create(data) {
            const hashedPassword = await hashPassword(data.password);
            const user = await this.prisma.user.create({
                data: {
                    ...data,
                    password: hashedPassword
                }
            });
            // Publish user created event with timestamp
            const event = new UserCreatedEvent(user);
            await this.eventBus.publish(event);
            return this.sanitizeUser(user);
        }
        async findAll() {
            const users = await this.prisma.user.findMany();
            return users.map(user => this.sanitizeUser(user));
        }
        async findById(id) {
            const user = await this.prisma.user.findUnique({ where: { id } });
            return user ? this.sanitizeUser(user) : null;
        }
        async findByEmail(email) {
            return this.prisma.user.findUnique({ where: { email } });
        }
        async update(id, data) {
            const user = await this.prisma.user.update({
                where: { id },
                data
            });
            // Publish user updated event with timestamp
            const event = new UserUpdatedEvent(user);
            await this.eventBus.publish(event);
            return this.sanitizeUser(user);
        }
        async delete(id) {
            await this.prisma.user.delete({ where: { id } });
            // Publish user deleted event
            await this.eventBus.publish(new UserDeletedEvent(id));
            return { success: true };
        }
        sanitizeUser(user) {
            const { password, ...sanitizedUser } = user;
            return sanitizedUser;
        }
    };
    __setFunctionName(_classThis, "UsersService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersService = _classThis;
})();
export { UsersService };
