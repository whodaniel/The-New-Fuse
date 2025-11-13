"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyHubExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let AgencyHubExceptionFilter = class AgencyHubExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : 500;
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            message: exception.message || 'Internal server error',
        });
    }
};
exports.AgencyHubExceptionFilter = AgencyHubExceptionFilter;
exports.AgencyHubExceptionFilter = AgencyHubExceptionFilter = __decorate([
    (0, common_1.Catch)()
], AgencyHubExceptionFilter);
//# sourceMappingURL=AgencyHubExceptionFilter.js.map