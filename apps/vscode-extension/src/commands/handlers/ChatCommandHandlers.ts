import { ChatViewProvider } from '../../ChatViewProvider';
import { CommandHandler } from '../VSCodeCommandAdapter';

export class SendMessageHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      chatProvider.sendMessage();
    }
  }
}

export class ClearChatHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      chatProvider.clearChat();
    }
  }
}

export class NewChatHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      chatProvider.newChat();
    }
  }
}
