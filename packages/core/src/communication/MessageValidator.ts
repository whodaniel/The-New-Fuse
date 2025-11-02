import { Injectable } from '@nestjs/common';
import { Message } from './MessageBroker';

export interface ValidationRule {
  field: string;
  validator: (value: any) => boolean;
  message: string;
}

@Injectable()
export class MessageValidator {
  private rules: Map<string, ValidationRule[]> = new Map();

  addRules(topic: string, rules: ValidationRule[]): void {
    this.rules.set(topic, rules);
  }

  validate(message: Message): { valid: boolean; errors: string[] } {
    const rules = this.rules.get(message.topic) || [];
    const errors: string[] = [];

    for (const rule of rules) {
      const value = this.getNestedValue(message.payload, rule.field);
      if (!rule.validator(value)) {
        errors.push(rule.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  hasRules(topic: string): boolean {
    return this.rules.has(topic);
  }

  getRules(topic: string): ValidationRule[] {
    return this.rules.get(topic) || [];
  }
}
