"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const secure_auth_guard_1 = require("../../../guards/secure-auth.guard");
const goose_dto_1 = require("./goose.dto");
const goose_service_1 = require("./goose.service");
let GooseController = class GooseController {
    constructor(gooseService) {
        this.gooseService = gooseService;
    }
    async getAccess(req) {
        return this.gooseService.getAccess(req.user || {});
    }
    async dispatch(body, req) {
        return this.gooseService.dispatch(body, req.user || {});
    }
};
exports.GooseController = GooseController;
__decorate([
    (0, common_1.Get)('access'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve Goose dispatch eligibility for the authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Goose access policy evaluated' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GooseController.prototype, "getAccess", null);
__decorate([
    (0, common_1.Post)('dispatch'),
    (0, swagger_1.ApiOperation)({ summary: 'Dispatch a Goose CLI run under role/membership policy' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Goose job dispatched' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [goose_dto_1.GooseDispatchDto, Object]),
    __metadata("design:returntype", Promise)
], GooseController.prototype, "dispatch", null);
exports.GooseController = GooseController = __decorate([
    (0, swagger_1.ApiTags)('agentic-goose'),
    (0, common_1.Controller)('agentic/goose'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.USER),
    __metadata("design:paramtypes", [goose_service_1.GooseService])
], GooseController);
//# sourceMappingURL=goose.controller.js.map