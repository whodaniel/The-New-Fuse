export interface MessageProtocol {
  // Implementation needed
}
  type: string;
  payload: any;
  timestamp: Date;
  senderId: string;
  recipientId?: string;
}

export interface ProtocolHandler {
  // Implementation needed
}
  type: string;
  handle(message: MessageProtocol): Promise<void>;
}

export class CommunicationProtocol {
  // Implementation needed
}
  private handlers: Map<string, ProtocolHandler> = new Map();
  registerHandler(handler: ProtocolHandler): void {
  // Implementation needed
}
    this.handlers.set(handler.type, handler);
  }

  async processMessage(message: MessageProtocol): Promise<void> {
  // Implementation needed
}
    const handler = this.handlers.get(message.type);
    if (handler) {
  // Implementation needed
}
      await handler.handle(message);
    }
  }

  createMessage(type: string, payload: any, senderId: string, recipientId?: string): MessageProtocol {
  // Implementation needed
}
    return {
  // Implementation needed
}
      type,
      payload,
      timestamp: new Date(),
      senderId,
      recipientId,
    };
  }
}