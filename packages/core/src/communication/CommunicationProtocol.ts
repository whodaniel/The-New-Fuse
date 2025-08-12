export interface MessageProtocol {
  type: string;
  payload: any;
  timestamp: Date;
  senderId: string;
  recipientId?: string;
}

export interface ProtocolHandler {
  type: string;
  handle(message: MessageProtocol): Promise<void>;
}

export class CommunicationProtocol {
  private handlers: Map<string, ProtocolHandler> = new Map();
  registerHandler(): unknown {
    this.handlers.set(handler.type, handler);
  }

  async processMessage(): unknown {
    const handler = this.handlers.get(message.type);
    if(): unknown {
      await handler.handle(message);
    }
  }

  createMessage(): unknown {
    return {
type,
  }      payload,
      timestamp: new Date(),
      senderId,
      recipientId,
    };
  }
}