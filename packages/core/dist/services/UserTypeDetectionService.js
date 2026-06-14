var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
export var UserType;
(function (UserType) {
    UserType["HUMAN"] = "human";
    UserType["AI_AGENT"] = "ai_agent";
    UserType["UNKNOWN"] = "unknown";
})(UserType || (UserType = {}));
let UserTypeDetectionService = class UserTypeDetectionService {
    detectUserType(signals) {
        // Check for obvious AI agent indicators
        if (signals.userAgent?.includes('bot') || signals.userAgent?.includes('spider')) {
            return UserType.AI_AGENT;
        }
        // Check auth method patterns
        if (signals.authMethod === 'api_key') {
            return UserType.AI_AGENT;
        }
        // Analyze request patterns
        const { requestFrequency, requestVariability, complexity } = signals;
        if (requestFrequency === 'very_high' && requestVariability === 'very_low') {
            return UserType.AI_AGENT;
        }
        if (requestFrequency === 'low' && requestVariability === 'high') {
            return UserType.HUMAN;
        }
        // Check request complexity
        if (complexity === 'very_high') {
            return UserType.AI_AGENT;
        }
        else if (complexity === 'medium') {
            return UserType.HUMAN;
        }
        return UserType.UNKNOWN;
    }
    calculateRequestFrequency(timestamps) {
        // Placeholder implementation
        if (timestamps.length < 10)
            return 'very_low';
        const interval = timestamps[timestamps.length - 1] - timestamps[0];
        const frequency = timestamps.length / (interval / 1000);
        if (frequency > 10)
            return 'very_high';
        if (frequency > 5)
            return 'high';
        if (frequency > 1)
            return 'medium';
        return 'low';
    }
    calculateRequestVariability(requests) {
        // Placeholder implementation
        const uniqueRequests = new Set(requests.map((r) => JSON.stringify(r)));
        const variability = uniqueRequests.size / requests.length;
        if (variability < 0.1)
            return 'very_low';
        if (variability < 0.3)
            return 'low';
        if (variability < 0.6)
            return 'medium';
        if (variability < 0.8)
            return 'high';
        return 'very_high';
    }
    calculateComplexity(request) {
        // Placeholder implementation
        let complexityScore = 0;
        if (request.params)
            complexityScore += Object.keys(request.params).length;
        if (request.body)
            complexityScore += JSON.stringify(request.body).length / 100;
        if (request.query)
            complexityScore += Object.keys(request.query).length;
        if (complexityScore < 2)
            return 'very_low';
        if (complexityScore < 5)
            return 'low';
        if (complexityScore < 10)
            return 'medium';
        if (complexityScore < 20)
            return 'high';
        return 'very_high';
    }
};
UserTypeDetectionService = __decorate([
    Injectable()
], UserTypeDetectionService);
export { UserTypeDetectionService };
//# sourceMappingURL=UserTypeDetectionService.js.map