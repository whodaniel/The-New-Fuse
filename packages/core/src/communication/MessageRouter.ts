import { Injectable } from '@nestjs/common';
import { MessageBroker, Message } from './MessageBroker';
export interface RouteRule {
  // Implementation needed
}
  topic: string;
  target: string;
  condition?: (message: Message) => boolean;
}

@Injectable()
export class MessageRouter {
  // Implementation needed
}
  private rules: RouteRule[] = [];
  constructor(private messageBroker: MessageBroker) {}

  addRule(rule: RouteRule): void {
  // Implementation needed
}
    this.rules.push(rule);
  }

  removeRule(topic: string, target: string): void {
  // Implementation needed
}
    this.rules = this.rules.filter(
      rule => rule.topic !== topic || rule.target !== target
    );
  }

  async routeMessage(message: Message): Promise<void> {
  // Implementation needed
}
    const applicableRules = this.rules.filter(
      rule => rule.topic === message.topic && (!rule.condition || rule.condition(message))
    );
    for (const rule of applicableRules) {
  // Implementation needed
}
      await this.messageBroker.publish(rule.target, message.payload);
    }
  }

  getRules(): RouteRule[] {
  // Implementation needed
}
    return [...this.rules];
  }
}