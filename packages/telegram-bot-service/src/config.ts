/**
 * Telegram Bot Service Configuration
 * 
 * Loaded from environment variables.
 * DO NOT commit actual tokens to version control.
 */

export interface TelegramBotConfig {
  token: string;
  username: string;
  webhookUrl?: string;
  allowedUserIds?: string[];
}

export function loadTelegramBotConfig(): TelegramBotConfig {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const username = process.env.TELEGRAM_BOT_USERNAME || 'tnf_cli_bot';
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const allowedUserIds = process.env.TELEGRAM_ALLOWED_USER_IDS?.split(',');

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
  }

  return {
    token,
    username,
    webhookUrl,
    allowedUserIds,
  };
}

export const config = loadTelegramBotConfig();
