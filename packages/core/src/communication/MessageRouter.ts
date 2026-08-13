import { Injectable } from '@nestjs/common';
import { MessageBroker, Message } from './MessageBroker.js';

export interface RouteRule {
  topic: string;
  target: string;
  condition?: (message: Message) => boolean;
}

@Injectable()
export class MessageRouter {
  private rules: RouteRule[] = [];

  constructor(private messageBroker: MessageBroker) {}

  addRule(rule: RouteRule): void {
    this.rules.push(rule);
  }

  removeRule(topic: string, target: string): void {
    this.rules = this.rules.filter(
      rule => rule.topic !== topic || rule.target !== target
    );
  }

  async routeMessage(message: Message): Promise<void> {
    const applicableRules = this.rules.filter(
      rule => rule.topic === message.topic && (!rule.condition || rule.condition(message))
    );

    for (const rule of applicableRules) {
      await this.messageBroker.publish(rule.target, message.payload);
    }
  }

  getRules(): RouteRule[] {
    return [...this.rules];
  }
}
