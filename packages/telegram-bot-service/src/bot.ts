/**
 * TNF Telegram Bot Service
 * 
 * Integrates TNF CLI with Telegram for remote command execution
 * and status notifications.
 */

import { Logger } from '@the-new-fuse/utils';
import { config } from './config';

const logger = new Logger({ service: 'telegram-bot' });

export interface BotMessage {
  chatId: number;
  userId: number;
  text: string;
  timestamp: string;
}

export class TelegramBot {
  private token: string;
  private baseUrl: string;
  private allowedUserIds: Set<number>;

  constructor(token: string, allowedUserIds?: number[]) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
    this.allowedUserIds = new Set(allowedUserIds || []);
  }

  async getMe(): Promise<{ id: number; username: string; is_bot: boolean }> {
    const response = await fetch(`${this.baseUrl}/getMe`);
    const data = await response.json();
    return data.result;
  }

  async sendMessage(chatId: number, text: string): Promise<boolean> {
    logger.info('Sending Telegram message', { chatId, textLength: text.length });

    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    return data.ok === true;
  }

  async getUpdates(offset?: number): Promise<BotMessage[]> {
    const url = new URL(`${this.baseUrl}/getUpdates`);
    if (offset) url.searchParams.set('offset', String(offset));
    url.searchParams.set('timeout', '30');

    const response = await fetch(url.toString());
    const data = await response.json();

    return (data.result || []).map((update: any) => ({
      chatId: update.message?.chat?.id,
      userId: update.message?.from?.id,
      text: update.message?.text,
      timestamp: new Date(update.message?.date * 1000).toISOString(),
    }));
  }

  isUserAllowed(userId: number): boolean {
    if (this.allowedUserIds.size === 0) return true; // Allow all if not configured
    return this.allowedUserIds.has(userId);
  }

  async startPolling(handler: (message: BotMessage) => Promise<void>): Promise<void> {
    logger.info('Starting Telegram bot polling', { username: config.username });

    let offset = 0;

    while (true) {
      try {
        const updates = await this.getUpdates(offset);

        for (const update of updates) {
          if (update.userId && !this.isUserAllowed(update.userId)) {
            logger.warn('Blocked unauthorized user', { userId: update.userId });
            continue;
          }

          await handler(update);
          offset = Math.max(offset, parseInt(update.timestamp) / 1000 + 1);
        }
      } catch (error) {
        logger.error('Polling error', { error: error instanceof Error ? error.message : 'Unknown' });
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

export function createTelegramBot(): TelegramBot {
  const allowedUserIds = config.allowedUserIds?.map(id => parseInt(id));
  return new TelegramBot(config.token, allowedUserIds);
}
