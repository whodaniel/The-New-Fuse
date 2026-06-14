var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let PromptCachingService = class PromptCachingService {
    buildCacheablePrompt(parts) {
        const messages = [];
        if (parts.systemContext) {
            messages.push(this.cacheSystemPrompt(parts.systemContext));
        }
        if (parts.documentation) {
            messages.push(this.cacheDocumentation(parts.documentation));
        }
        messages.push(this.buildDynamicQuery(parts.actualQuery));
        return messages;
    }
    cacheSystemPrompt(systemContext) {
        return {
            role: 'user',
            content: systemContext,
            cache_control: { type: 'ephemeral' },
        };
    }
    cacheDocumentation(documentation) {
        return {
            role: 'user',
            content: documentation,
            cache_control: { type: 'ephemeral' },
        };
    }
    buildDynamicQuery(actualQuery) {
        return {
            role: 'user',
            content: actualQuery,
        };
    }
};
PromptCachingService = __decorate([
    Injectable()
], PromptCachingService);
export { PromptCachingService };
//# sourceMappingURL=prompt-caching.service.js.map