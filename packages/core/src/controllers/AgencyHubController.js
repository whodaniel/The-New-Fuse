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
exports.AgencyHubController = void 0;
const common_1 = require("@nestjs/common");
const AgencyHubService_1 = require("../services/AgencyHubService");
let AgencyHubController = class AgencyHubController {
    agencyHubService;
    constructor(agencyHubService) {
        this.agencyHubService = agencyHubService;
    }
    async getStatus() {
        return this.agencyHubService.getStats();
    }
    async getAgencies() {
        return this.agencyHubService.getAgencies();
    }
    async createAgency(data) {
        return this.agencyHubService.createAgency(data);
    }
};
exports.AgencyHubController = AgencyHubController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('agencies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "getAgencies", null);
__decorate([
    (0, common_1.Post)('agencies'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "createAgency", null);
exports.AgencyHubController = AgencyHubController = __decorate([
    (0, common_1.Controller)('agency-hub'),
    __metadata("design:paramtypes", [AgencyHubService_1.AgencyHubService])
], AgencyHubController);
//# sourceMappingURL=AgencyHubController.js.map