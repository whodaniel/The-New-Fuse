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
let AlertService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AlertService = _classThis = class {
        constructor(configService, eventEmitter) {
            this.configService = configService;
            this.eventEmitter = eventEmitter;
        }
        /**
         * Send a system alert
         */
        sendAlert(alertType, message, severity = 'info', metadata = {}) {
            const alert = {
                type: alertType,
                message,
                severity,
                timestamp: new Date(),
                metadata,
            };
            // Emit event for alert handlers
            this.eventEmitter.emit('system.alert', alert);
            // Log critical alerts to console as well
            if (severity === 'critical' || severity === 'error') {
                console.error(`[ALERT] ${alertType}: ${message}`);
            }
        }
        /**
         * Send an info level alert
         */
        info(alertType, message, metadata = {}) {
            this.sendAlert(alertType, message, 'info', metadata);
        }
        /**
         * Send a warning level alert
         */
        warning(alertType, message, metadata = {}) {
            this.sendAlert(alertType, message, 'warning', metadata);
        }
        /**
         * Send an error level alert
         */
        error(alertType, message, metadata = {}) {
            this.sendAlert(alertType, message, 'error', metadata);
        }
        /**
         * Send a critical level alert
         */
        critical(alertType, message, metadata = {}) {
            this.sendAlert(alertType, message, 'critical', metadata);
        }
        /**
         * Check if alerts should be sent based on environment
         */
        shouldSendAlerts() {
            const environment = this.configService.get('NODE_ENV');
            const alertsEnabled = this.configService.get('ALERTS_ENABLED');
            // Default to enabled for production, disabled for development/test
            if (alertsEnabled !== undefined) {
                return alertsEnabled === 'true';
            }
            return environment === 'production';
        }
    };
    __setFunctionName(_classThis, "AlertService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AlertService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AlertService = _classThis;
})();
export { AlertService };
