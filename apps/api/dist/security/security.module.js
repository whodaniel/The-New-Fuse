"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityModule = void 0;
const common_1 = require("@nestjs/common");
const security_logging_service_1 = require("./security-logging.service");
const input_sanitization_service_1 = require("./input-sanitization.service");
const response_sanitization_service_1 = require("./response-sanitization.service");
const enhanced_rate_limit_service_1 = require("./enhanced-rate-limit.service");
const api_endpoint_monitoring_service_1 = require("./api-endpoint-monitoring.service");
const security_integration_service_1 = require("./security-integration.service");
/**
 * Global Security Module
 *
 * Provides security services globally so they can be injected anywhere,
 * including in guards that are used as decorators on controllers.
 */
let SecurityModule = class SecurityModule {
};
exports.SecurityModule = SecurityModule;
exports.SecurityModule = SecurityModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            security_logging_service_1.SecurityLoggingService,
            input_sanitization_service_1.InputSanitizationService,
            response_sanitization_service_1.ResponseSanitizationService,
            enhanced_rate_limit_service_1.EnhancedRateLimitService,
            api_endpoint_monitoring_service_1.ApiEndpointMonitoringService,
            security_integration_service_1.SecurityIntegrationService,
        ],
        exports: [
            security_logging_service_1.SecurityLoggingService,
            input_sanitization_service_1.InputSanitizationService,
            response_sanitization_service_1.ResponseSanitizationService,
            enhanced_rate_limit_service_1.EnhancedRateLimitService,
            api_endpoint_monitoring_service_1.ApiEndpointMonitoringService,
            security_integration_service_1.SecurityIntegrationService,
        ],
    })
], SecurityModule);
//# sourceMappingURL=security.module.js.map