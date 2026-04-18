/**
 * Chrome Extension Federation Module - Index Export
 */

export { FederationManager, federationManager } from './FederationManager.js';
export type {
  AIPlatform,
  ChannelMember,
  ChannelMessage,
  ChannelMode,
  ChannelSettings,
  FederationChannel,
  MemberStatus,
  MemberType,
} from './FederationManager.js';
export { RedisBridge, redisBridge } from './RedisBridge.js';
export type { RedisAgentInfo, RedisAgentMessage, RedisBridgeConfig } from './RedisBridge.js';
