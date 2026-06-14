var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let MessageClassifier = class MessageClassifier {
    constructor() {
        this.patterns = {
            command: [/^\/\w+/, /^execute/, /^run/, /^start/, /^stop/],
            query: [/\?$/, /^what/, /^how/, /^when/, /^where/, /^why/],
            notification: [/alert/, /warning/, /error/, /info/],
            response: [/^ok/, /^done/, /^completed/, /^failed/]
        };
    }
    classify(message) {
        const text = message.toLowerCase().trim();
        // Determine type
        let type = 'response';
        let confidence = 0.5;
        for (const [messageType, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    type = messageType;
                    confidence = 0.8;
                    break;
                }
            }
            if (confidence > 0.5)
                break;
        }
        // Determine priority
        const priority = this.determinePriority(text);
        // Determine category
        const category = this.determineCategory(text);
        return {
            type,
            priority,
            category,
            confidence
        };
    }
    determinePriority(text) {
        if (text.includes('urgent') || text.includes('critical') || text.includes('error')) {
            return 'high';
        }
        if (text.includes('warning') || text.includes('important')) {
            return 'medium';
        }
        return 'low';
    }
    determineCategory(text) {
        if (text.includes('auth') || text.includes('login'))
            return 'authentication';
        if (text.includes('data') || text.includes('database'))
            return 'data';
        if (text.includes('network') || text.includes('api'))
            return 'network';
        if (text.includes('system') || text.includes('server'))
            return 'system';
        return 'general';
    }
};
MessageClassifier = __decorate([
    Injectable()
], MessageClassifier);
export { MessageClassifier };
//# sourceMappingURL=MessageClassifier.js.map