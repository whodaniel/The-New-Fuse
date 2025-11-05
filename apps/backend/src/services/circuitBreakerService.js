"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerService = void 0;
const common_1 = require("@nestjs/common");
let CircuitBreakerService = class CircuitBreakerService {
    states = new Map();
    defaultOptions = {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
    };
    async execute(key, operation, options = {}) {
        const { failureThreshold, resetTimeout } = {
            ...this.defaultOptions,
            ...options,
        };
        const state = this.getState(key);
        if (state.isOpen) {
            if (Date.now() - state.lastFailureTime >= resetTimeout) {
                state.isOpen = false;
                state.failures = 0;
            }
            else {
                throw new Error('Circuit breaker is open');
            }
        }
        try {
            const result = await operation();
            state.failures = 0;
            return result;
        }
        catch (error) {
            state.failures++;
            state.lastFailureTime = Date.now();
            if (state.failures >= failureThreshold) {
                state.isOpen = true;
            }
            throw error;
        }
    }
    getState(key) {
        if (!this.states.has(key)) {
            this.states.set(key, {
                failures: 0,
                lastFailureTime: 0,
                isOpen: false,
            });
        }
        return this.states.get(key);
    }
    reset(key) {
        this.states.delete(key);
    }
    resetAll() {
        this.states.clear();
    }
};
exports.CircuitBreakerService = CircuitBreakerService;
exports.CircuitBreakerService = CircuitBreakerService = __decorate([
    (0, common_1.Injectable)()
], CircuitBreakerService);
//# sourceMappingURL=circuitBreakerService.js.map