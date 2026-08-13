import {
  type ResourceNegotiationPayload as ResourceNegotiationPayloadType,
  type ResourceStrategy as ResourceStrategyType,
  type ResourceTier as ResourceTierType,
  ResourceNegotiationPayloadSchema,
  ResourceStrategySchema,
  ResourceTierSchema,
} from '@the-new-fuse/protocol-contracts';

// Re-export for compatibility
export const ResourceTier = ResourceTierSchema;
export type ResourceTier = ResourceTierType;

export const ResourceStrategy = ResourceStrategySchema;
export type ResourceStrategy = ResourceStrategyType;

export const ResourceNegotiationPayload = ResourceNegotiationPayloadSchema;
export type ResourceNegotiationPayload = ResourceNegotiationPayloadType;
