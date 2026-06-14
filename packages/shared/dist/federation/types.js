"use strict";
/**
 * TNF Federation Types
 *
 * Defines the data structures for the Federation system that enables
 * grouping browser tabs (AI chats) into channels for coordinated
 * multi-AI conversations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FederationMessageType = void 0;
exports.createFederationMessage = createFederationMessage;
exports.createChannelMember = createChannelMember;
exports.createFederation = createFederation;
exports.createChannel = createChannel;
// ============================================================================
// FEDERATION MESSAGE TYPES
// ============================================================================
/**
 * Message types for federation communication
 */
var FederationMessageType;
(function (FederationMessageType) {
    // Channel Management
    FederationMessageType["CHANNEL_CREATE"] = "FEDERATION_CHANNEL_CREATE";
    FederationMessageType["CHANNEL_UPDATE"] = "FEDERATION_CHANNEL_UPDATE";
    FederationMessageType["CHANNEL_DELETE"] = "FEDERATION_CHANNEL_DELETE";
    // Member Management
    FederationMessageType["MEMBER_JOIN"] = "FEDERATION_MEMBER_JOIN";
    FederationMessageType["MEMBER_LEAVE"] = "FEDERATION_MEMBER_LEAVE";
    FederationMessageType["MEMBER_UPDATE"] = "FEDERATION_MEMBER_UPDATE";
    FederationMessageType["MEMBER_STATUS"] = "FEDERATION_MEMBER_STATUS";
    // Message Routing
    FederationMessageType["CHANNEL_MESSAGE"] = "FEDERATION_CHANNEL_MESSAGE";
    FederationMessageType["DIRECT_MESSAGE"] = "FEDERATION_DIRECT_MESSAGE";
    FederationMessageType["BROADCAST"] = "FEDERATION_BROADCAST";
    // Context Sync
    FederationMessageType["CONTEXT_SYNC"] = "FEDERATION_CONTEXT_SYNC";
    FederationMessageType["CONTEXT_REQUEST"] = "FEDERATION_CONTEXT_REQUEST";
    // Orchestration
    FederationMessageType["ROUTE_REQUEST"] = "FEDERATION_ROUTE_REQUEST";
    FederationMessageType["ROUTE_RESPONSE"] = "FEDERATION_ROUTE_RESPONSE";
    FederationMessageType["TASK_ASSIGN"] = "FEDERATION_TASK_ASSIGN";
    FederationMessageType["TASK_COMPLETE"] = "FEDERATION_TASK_COMPLETE";
    // Status
    FederationMessageType["HEARTBEAT"] = "FEDERATION_HEARTBEAT";
    FederationMessageType["STATUS_REQUEST"] = "FEDERATION_STATUS_REQUEST";
    FederationMessageType["STATUS_RESPONSE"] = "FEDERATION_STATUS_RESPONSE";
})(FederationMessageType || (exports.FederationMessageType = FederationMessageType = {}));
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Create a new federation message
 */
function createFederationMessage(type, federationId, source, payload, options) {
    return {
        id: `fed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        federationId,
        channelId: options?.channelId,
        source,
        target: options?.target,
        payload,
        timestamp: new Date().toISOString(),
        correlationId: options?.correlationId,
    };
}
/**
 * Create a new channel member
 */
function createChannelMember(type, name, source, connectionInfo, options) {
    const now = new Date().toISOString();
    return {
        id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        platform: options?.platform,
        source,
        name,
        status: 'active',
        capabilities: options?.capabilities || [],
        joinedAt: now,
        lastSeen: now,
        connectionInfo,
        metadata: options?.metadata,
    };
}
/**
 * Create a new federation
 */
function createFederation(name, options) {
    const now = new Date().toISOString();
    return {
        id: `fed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description: options?.description,
        channels: [],
        createdAt: now,
        updatedAt: now,
        createdBy: 'user',
        status: 'active',
        settings: {
            allowAutoJoin: true,
            persistSessions: true,
            shareContextGlobally: false,
            ...options?.settings,
        },
    };
}
/**
 * Create a new channel
 */
function createChannel(name, federationId, options) {
    const now = new Date().toISOString();
    return {
        id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description: options?.description,
        federationId,
        members: [],
        mode: options?.mode || 'broadcast',
        settings: {
            autoRoute: true,
            shareContext: true,
            syncMessages: true,
            ...options?.settings,
        },
        createdAt: now,
        lastActivity: now,
        messageCount: 0,
    };
}
//# sourceMappingURL=types.js.map