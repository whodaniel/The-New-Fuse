var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Controller, UseGuards } from '@nestjs/common';
import { AgentLLMService } from '@the-new-fuse/core';
import { AuthGuard } from '../guards/auth.guard';
let NeuralController = class NeuralController {
    agentService;
    constructor(agentService) {
        this.agentService = agentService;
    }
};
NeuralController = __decorate([
    Controller('neural'),
    UseGuards(AuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentLLMService !== "undefined" && AgentLLMService) === "function" ? _a : Object])
], NeuralController);
export { NeuralController };
//# sourceMappingURL=neural.js.map