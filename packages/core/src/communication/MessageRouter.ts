import { Injectable } from '@nestjs/common';
import { MessageBroker, Message } from './MessageBroker';
export interface RouteRule {
  topic: string;
  target: string;
  condition?: (message: Message) => boolean;
}

@Injectable()
export class MessageRouter {
  private rules: RouteRule[] = [];
  constructor(private messageBroker: MessageBroker) {}

  addRule(): unknown {
    this.rules.push(rule);
  }

  removeRule(): unknown {
    this.rules = this.rules.filter(
      rule => rule.topic !== topic || rule.target !== target
    );
  }

  async routeMessage(): unknown {
    const applicableRules = this.rules.filter(
      rule => rule.topic === message.topic && (!rule.condition || rule.condition(message))
    );
    for(): unknown {
      await this.messageBroker.publish(rule.target, message.payload);
    }
  }

  getRules(): unknown {
    return [...this.rules];
  }
}