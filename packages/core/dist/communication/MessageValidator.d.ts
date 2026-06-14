import { Message } from './MessageBroker.js';
export interface ValidationRule {
    field: string;
    validator: (value: any) => boolean;
    message: string;
}
export declare class MessageValidator {
    private rules;
    addRules(topic: string, rules: ValidationRule[]): void;
    validate(message: Message): {
        valid: boolean;
        errors: string[];
    };
    private getNestedValue;
    hasRules(topic: string): boolean;
    getRules(topic: string): ValidationRule[];
}
//# sourceMappingURL=MessageValidator.d.ts.map