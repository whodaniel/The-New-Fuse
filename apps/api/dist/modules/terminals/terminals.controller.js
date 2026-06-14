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
exports.TerminalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_policy_1 = require("../../auth/auth-policy");
const secure_auth_guard_1 = require("../../guards/secure-auth.guard");
const terminal_graph_query_dto_1 = require("./dto/terminal-graph-query.dto");
const terminals_service_1 = require("./terminals.service");
let TerminalsController = class TerminalsController {
    constructor(terminalsService) {
        this.terminalsService = terminalsService;
    }
    async getTerminalGraph(query, req) {
        if (query.includeCommands === true && !(0, auth_policy_1.hasAuthorizationLevel)(req.user || {}, 'admin')) {
            throw new common_1.ForbiddenException('includeCommands=true requires admin or system authorization level');
        }
        return this.terminalsService.getTerminalGraph(query);
    }
};
exports.TerminalsController = TerminalsController;
__decorate([
    (0, common_1.Get)('graph'),
    (0, swagger_1.ApiOperation)({
        summary: 'Return a holistic TWIP terminal graph for agent/runtime orchestration',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Graph projection of terminal identities, process/multiplexer relationships, and runtime ownership hints.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [terminal_graph_query_dto_1.TerminalGraphQueryDto, Object]),
    __metadata("design:returntype", Promise)
], TerminalsController.prototype, "getTerminalGraph", null);
exports.TerminalsController = TerminalsController = __decorate([
    (0, swagger_1.ApiTags)('terminals'),
    (0, common_1.Controller)('terminals'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.USER),
    __metadata("design:paramtypes", [terminals_service_1.TerminalsService])
], TerminalsController);
//# sourceMappingURL=terminals.controller.js.map