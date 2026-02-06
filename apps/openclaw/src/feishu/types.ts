import type { FeishuAccountConfig, FeishuConfig } from '../config/types.feishu.js';

export type { FeishuAccountConfig, FeishuConfig };

export type FeishuContext = {
  appId: string;
  chatId?: string;
  openId?: string;
  userId?: string;
  messageId?: string;
  messageType?: string;
  text?: string;
  raw?: unknown;
};
