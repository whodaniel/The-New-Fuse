var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MidsceneLLMAdapter_1;
import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider } from './LLMProvider.js';
let MidsceneLLMAdapter = MidsceneLLMAdapter_1 = class MidsceneLLMAdapter {
    constructor(llmProvider) {
        this.llmProvider = llmProvider;
        this.logger = new Logger(MidsceneLLMAdapter_1.name);
    }
    async generate(prompt) {
        this.logger.log(`Generating text for prompt: ${prompt}`);
        return this.llmProvider.generate(prompt);
    }
};
MidsceneLLMAdapter = MidsceneLLMAdapter_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [LLMProvider])
], MidsceneLLMAdapter);
export { MidsceneLLMAdapter };
//# sourceMappingURL=MidsceneLLMAdapter.js.map