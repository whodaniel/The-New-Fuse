import { Injectable } from '@nestjs/common';
import { Message } from './MessageBroker';
export interface ValidationRule {
  // Implementation needed
}
  field: string;
  validator(value: any) => boolean;
  message: string;
}

@Injectable()
export class MessageValidator {
  // Implementation needed
}
  private rules: Map<string, ValidationRule[]> = new Map();
  addRules(topic: string, rules: ValidationRule[]): void {
  // Implementation needed
}
    this.rules.set(topic, rules);
  }

  validate(message: Message): { valid: boolean; errors: string[] } {
  // Implementation needed
}
    const rules = this.rules.get(message.topic) || [];
    const errors: string[] = [];
    for (const rule of rules) {
  // Implementation needed
}
      const value = this.getNestedValue(message.payload, rule.field);
      if (!rule.validator(value)) {
  // Implementation needed
}
        errors.push(rule.message);
      }
    }

    return {
  // Implementation needed
}
      valid: errors.length === 0,
      errors,
    };
  }

  private getNestedValue(obj: any, path: string): any {
  // Implementation needed
}
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  hasRules(topic: string): boolean {
  // Implementation needed
}
    return this.rules.has(topic);
  }

  getRules(topic: string): ValidationRule[] {
  // Implementation needed
}
    return this.rules.get(topic) || [];
  }
}