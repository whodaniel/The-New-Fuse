import {
  type FederationGateDecision as FederationGateDecisionType,
  type HandoffAckInput as HandoffAckInputT,
  type HandoffAck as HandoffAckT,
  type HandoffPacketInput as HandoffPacketInputT,
  type HandoffPacket as HandoffPacketT,
  type HandoffPacketVersion as HandoffPacketVersionT,
  type HandoffPayload as HandoffPayloadT,
  type HandoffPriority as HandoffPriorityT,
  type HandoffScope as HandoffScopeT,
  type HandoffStatus as HandoffStatusT,
  type HandoffTargets as HandoffTargetsT,
  type MasterCumulativeId as MasterCumulativeIdT,
  type TNFResourcePointer as TNFResourcePointerT,
  FederationGateDecisionSchema,
  HandoffAckInputSchema,
  HandoffAckSchema,
  HandoffPacketInputSchema,
  HandoffPacketSchema,
  HandoffPacketVersionSchema,
  HandoffPayloadSchema,
  HandoffPrioritySchema,
  HandoffScopeSchema,
  HandoffStatusSchema,
  HandoffTargetsSchema,
  MasterCumulativeIdSchema,
  TNFResourcePointerSchema,
} from '@the-new-fuse/protocol-contracts';

// Re-export for compatibility
export const HandoffPriority = HandoffPrioritySchema;
export type HandoffPriority = HandoffPriorityT;

export const HandoffStatus = HandoffStatusSchema;
export type HandoffStatus = HandoffStatusT;

export const FederationGateDecision = FederationGateDecisionSchema;
export type FederationGateDecision = FederationGateDecisionType;

export const MasterCumulativeId = MasterCumulativeIdSchema;
export type MasterCumulativeId = MasterCumulativeIdT;

export const TNFResourcePointer = TNFResourcePointerSchema;
export type TNFResourcePointer = TNFResourcePointerT;

export const HandoffPayload = HandoffPayloadSchema;
export type HandoffPayload = HandoffPayloadT;

export const HandoffScope = HandoffScopeSchema;
export type HandoffScope = HandoffScopeT;

export const HandoffTargets = HandoffTargetsSchema;
export type HandoffTargets = HandoffTargetsT;

export const HandoffPacketInput = HandoffPacketInputSchema;
export type HandoffPacketInput = HandoffPacketInputT;

export const HandoffPacketVersion = HandoffPacketVersionSchema;
export type HandoffPacketVersion = HandoffPacketVersionT;

export const HandoffPacket = HandoffPacketSchema;
export type HandoffPacket = HandoffPacketT;

export const HandoffAck = HandoffAckSchema;
export type HandoffAck = HandoffAckT;

export const HandoffAckInput = HandoffAckInputSchema;
export type HandoffAckInput = HandoffAckInputT;

// Specific aliases used by services
export type HandoffPacketType = HandoffPacket;
export type HandoffAckType = HandoffAck;
