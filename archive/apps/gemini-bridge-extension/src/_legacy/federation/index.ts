/**
 * Chrome Extension Federation Module - Index Export
 */

export { FederationManager, federationManager } from './FederationManager';
export type {
  AIPlatform,
  ChannelMember,
  ChannelMessage,
  ChannelMode,
  ChannelSettings,
  FederationChannel,
  MemberStatus,
  MemberType,
} from './FederationManager';
export { RedisBridge, redisBridge } from './RedisBridge';
export type { RedisAgentInfo, RedisAgentMessage, RedisBridgeConfig } from './RedisBridge';
