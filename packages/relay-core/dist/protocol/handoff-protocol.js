"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoffAckInput = exports.HandoffAck = exports.HandoffPacket = exports.HandoffPacketVersion = exports.HandoffPacketInput = exports.HandoffTargets = exports.HandoffScope = exports.HandoffPayload = exports.TNFResourcePointer = exports.MasterCumulativeId = exports.FederationGateDecision = exports.HandoffStatus = exports.HandoffPriority = void 0;
const protocol_contracts_1 = require("@the-new-fuse/protocol-contracts");
// Re-export for compatibility
exports.HandoffPriority = protocol_contracts_1.HandoffPrioritySchema;
exports.HandoffStatus = protocol_contracts_1.HandoffStatusSchema;
exports.FederationGateDecision = protocol_contracts_1.FederationGateDecisionSchema;
exports.MasterCumulativeId = protocol_contracts_1.MasterCumulativeIdSchema;
exports.TNFResourcePointer = protocol_contracts_1.TNFResourcePointerSchema;
exports.HandoffPayload = protocol_contracts_1.HandoffPayloadSchema;
exports.HandoffScope = protocol_contracts_1.HandoffScopeSchema;
exports.HandoffTargets = protocol_contracts_1.HandoffTargetsSchema;
exports.HandoffPacketInput = protocol_contracts_1.HandoffPacketInputSchema;
exports.HandoffPacketVersion = protocol_contracts_1.HandoffPacketVersionSchema;
exports.HandoffPacket = protocol_contracts_1.HandoffPacketSchema;
exports.HandoffAck = protocol_contracts_1.HandoffAckSchema;
exports.HandoffAckInput = protocol_contracts_1.HandoffAckInputSchema;
//# sourceMappingURL=handoff-protocol.js.map