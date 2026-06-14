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
const jwt_1 = require("@nestjs/jwt");
const security_controller_1 = require("../../controllers/security.controller");
const input_sanitization_service_1 = require("../../security/input-sanitization.service");
const response_sanitization_service_1 = require("../../security/response-sanitization.service");
const security_logging_service_1 = require("../../security/security-logging.service");
const security_testing_service_1 = require("../../security/security-testing.service");
/**
 * Security Module
 *
 * Provides comprehensive security testing, monitoring, and configuration
 * management capabilities. This module handles security validation,
 * vulnerability testing, input sanitization verification, and security
 * system health monitoring.
 *
 * The module includes:
 * - Comprehensive security test suites
 * - XSS (Cross-Site Scripting) protection testing
 * - SQL injection prevention validation
 * - Input sanitization verification
 * - Response data sanitization testing
 * - Security system health monitoring
 * - Security configuration management
 */
let SecurityModule = class SecurityModule {
};
exports.SecurityModule = SecurityModule;
exports.SecurityModule = SecurityModule = __decorate([
    (0, common_1.Module)({
        imports: [jwt_1.JwtModule],
        controllers: [security_controller_1.SecurityController],
        providers: [
            security_testing_service_1.SecurityTestingService,
            input_sanitization_service_1.InputSanitizationService,
            response_sanitization_service_1.ResponseSanitizationService,
            security_logging_service_1.SecurityLoggingService,
        ],
        exports: [security_testing_service_1.SecurityTestingService, input_sanitization_service_1.InputSanitizationService, response_sanitization_service_1.ResponseSanitizationService],
    })
], SecurityModule);
//# sourceMappingURL=security.module.js.map