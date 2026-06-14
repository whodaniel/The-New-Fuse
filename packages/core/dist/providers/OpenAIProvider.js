var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OpenAIProvider_1;
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { assertDevLoopBudget } from '../utils/dev-loop-guard.js';
import { loadRootEnv } from '../utils/root-env.js';
let OpenAIProvider = OpenAIProvider_1 = class OpenAIProvider {
    constructor() {
        this.logger = new Logger(OpenAIProvider_1.name);
        loadRootEnv();
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async generate(prompt) {
        assertDevLoopBudget('core.openai.generate', { prompt });
        this.logger.log(`Generating text for prompt: ${prompt}`);
        const completion = await this.openai.completions.create({
            model: 'text-davinci-003',
            prompt,
        });
        return completion.choices[0].text;
    }
};
OpenAIProvider = OpenAIProvider_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], OpenAIProvider);
export { OpenAIProvider };
//# sourceMappingURL=OpenAIProvider.js.map