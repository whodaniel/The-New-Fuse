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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayHealthController = void 0;
const common_1 = require("@nestjs/common");
let RelayHealthController = class RelayHealthController {
    constructor() {
        this.lastHeartbeat = Date.now();
        this.messageCount = 0;
        this.connectedAgents = new Map();
    }
    getHealth() {
        return {
            status: 'alive',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            lastHeartbeat: this.lastHeartbeat,
            messageCount: this.messageCount,
            connectedAgents: Array.from(this.connectedAgents.entries()).map(([id, lastSeen]) => ({
                id,
                lastSeen,
                age: Date.now() - lastSeen,
            })),
        };
    }
    getAgents() {
        return {
            count: this.connectedAgents.size,
            agents: Array.from(this.connectedAgents.entries()).map(([id, lastSeen]) => ({
                id,
                lastSeen: new Date(lastSeen).toISOString(),
                status: Date.now() - lastSeen < 10000 ? 'active' : 'stalled',
            })),
        };
    }
    recordHeartbeat(agentId) {
        this.lastHeartbeat = Date.now();
        this.messageCount++;
        this.connectedAgents.set(agentId, Date.now());
    }
};
exports.RelayHealthController = RelayHealthController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RelayHealthController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('agents'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RelayHealthController.prototype, "getAgents", null);
exports.RelayHealthController = RelayHealthController = __decorate([
    (0, common_1.Controller)('relay')
], RelayHealthController);
//# sourceMappingURL=relay-health.controller.js.map