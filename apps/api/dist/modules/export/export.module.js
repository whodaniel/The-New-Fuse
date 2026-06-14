"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const export_controller_1 = require("../../controllers/export.controller");
const security_logging_service_1 = require("../../security/security-logging.service");
/**
 * Export Module
 *
 * Provides data export functionality for conversations and other system data.
 * This module supports multiple output formats and handles the conversion
 * of internal data structures to user-friendly export formats.
 *
 * Currently supports:
 * - JSON format for programmatic access
 * - Markdown format for documentation and reading
 * - HTML format for web viewing and printing
 */
let ExportModule = class ExportModule {
};
exports.ExportModule = ExportModule;
exports.ExportModule = ExportModule = __decorate([
    (0, common_1.Module)({
        imports: [jwt_1.JwtModule],
        controllers: [export_controller_1.ExportController],
        providers: [security_logging_service_1.SecurityLoggingService],
        exports: [],
    })
], ExportModule);
//# sourceMappingURL=export.module.js.map