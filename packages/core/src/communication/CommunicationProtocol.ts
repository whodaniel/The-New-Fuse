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

  registerHandler(handler: ProtocolHandler): void {
    this.handlers.set(handler.type, handler);
  }

  async processMessage(message: MessageProtocol): Promise<void> {
    const handler = this.handlers.get(message.type);
    if (handler) {
      await handler.handle(message);
    }
  }

  createMessage(
    type: string,
    payload: any,
    senderId: string,
    recipientId?: string,
  ): MessageProtocol {
    return {
      type,
      payload,
      timestamp: new Date(),
      senderId,
      recipientId,
    };
  }
}
