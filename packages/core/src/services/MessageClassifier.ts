import { Injectable } from '@nestjs/common';

export interface MessageClassification {
  type: 'command' | 'query' | 'response' | 'notification';
  priority: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
}

@Injectable()
export class MessageClassifier {
  private patterns = {
    command: [/^\/\w+/, /^execute/, /^run/, /^start/, /^stop/],
    query: [/\?$/, /^what/, /^how/, /^when/, /^where/, /^why/],
    notification: [/alert/, /warning/, /error/, /info/],
    response: [/^ok/, /^done/, /^completed/, /^failed/],
  };

  classify(message: string): MessageClassification {
    const text = message.toLowerCase().trim();

    // Determine type
    let type: MessageClassification['type'] = 'response';
    let confidence = 0.5;

    for (const [messageType, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          type = messageType as MessageClassification['type'];
          confidence = 0.8;
          break;
        }
      }
      if (confidence > 0.5) break;
    }

    // Determine priority
    const priority = this.determinePriority(text);

    // Determine category
    const category = this.determineCategory(text);

    return {
      type,
      priority,
      category,
      confidence,
    };
  }

  private determinePriority(text: string): MessageClassification['priority'] {
    if (text.includes('urgent') || text.includes('critical') || text.includes('error')) {
      return 'high';
    }
    if (text.includes('warning') || text.includes('important')) {
      return 'medium';
    }
    return 'low';
  }

  private determineCategory(text: string): string {
    if (text.includes('auth') || text.includes('login')) return 'authentication';
    if (text.includes('data') || text.includes('database')) return 'data';
    if (text.includes('network') || text.includes('api')) return 'network';
    if (text.includes('system') || text.includes('server')) return 'system';
    return 'general';
  }
}
