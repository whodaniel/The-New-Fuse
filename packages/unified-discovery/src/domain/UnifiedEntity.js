"use strict";
/**
 * Unified Entity Domain Model
 *
 * Core domain model for all discoverable entities in The New Fuse system.
 * Uses Domain-Driven Design principles with rich domain logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedEntity = exports.EntityRelationshipDetectedEvent = exports.EntityCapabilitiesUpdatedEvent = exports.EntityDiscoveredEvent = exports.EntityMetadata = exports.DiscoverySource = exports.CapabilitySet = exports.Capability = exports.CapabilityType = exports.EntityArchetype = exports.EntityIdentity = exports.EntityId = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const uuid_1 = require("uuid");
// Value Objects
class EntityId {
    value;
    constructor(value) {
        this.value = value;
        if (!value || value.trim().length === 0) {
            throw new Error('EntityId cannot be empty');
        }
    }
    static generate() {
        return new EntityId((0, uuid_1.v4)());
    }
    static fromString(value) {
        return new EntityId(value);
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.EntityId = EntityId;
class EntityIdentity {
    name;
    displayName;
    description;
    version;
    namespace;
    constructor(name, displayName, description, version, namespace) {
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.version = version;
        this.namespace = namespace;
        if (!name || name.trim().length === 0) {
            throw new Error('Entity name cannot be empty');
        }
    }
    getFullyQualifiedName() {
        return this.namespace ? `${this.namespace}:${this.name}` : this.name;
    }
}
exports.EntityIdentity = EntityIdentity;
var EntityArchetype;
(function (EntityArchetype) {
    // Cognitive Agents
    EntityArchetype["REASONING_AGENT"] = "reasoning_agent";
    EntityArchetype["PLANNING_AGENT"] = "planning_agent";
    EntityArchetype["LEARNING_AGENT"] = "learning_agent";
    EntityArchetype["CREATIVE_AGENT"] = "creative_agent";
    // Functional Agents
    EntityArchetype["EXECUTION_AGENT"] = "execution_agent";
    EntityArchetype["COORDINATION_AGENT"] = "coordination_agent";
    EntityArchetype["MONITORING_AGENT"] = "monitoring_agent";
    EntityArchetype["OPTIMIZATION_AGENT"] = "optimization_agent";
    // Infrastructure Entities
    EntityArchetype["PROTOCOL_BRIDGE"] = "protocol_bridge";
    EntityArchetype["SERVICE_MESH_NODE"] = "service_mesh_node";
    EntityArchetype["CAPABILITY_PROVIDER"] = "capability_provider";
    EntityArchetype["RESOURCE_MANAGER"] = "resource_manager";
    // Hybrid Entities
    EntityArchetype["AGENT_SERVICE_HYBRID"] = "agent_service_hybrid";
    EntityArchetype["TOOL_AGENT_HYBRID"] = "tool_agent_hybrid";
    EntityArchetype["EXTENSION_AGENT_HYBRID"] = "extension_agent_hybrid";
    // Legacy Types (for backward compatibility)
    EntityArchetype["CLI_AGENT"] = "cli_agent";
    EntityArchetype["API_AGENT"] = "api_agent";
    EntityArchetype["SUB_AGENT"] = "sub_agent";
    EntityArchetype["PYDANTIC_AGENT"] = "pydantic_agent";
    EntityArchetype["MCP_SERVER"] = "mcp_server";
})(EntityArchetype || (exports.EntityArchetype = EntityArchetype = {}));
var CapabilityType;
(function (CapabilityType) {
    // Cognitive Capabilities
    CapabilityType["REASONING"] = "reasoning";
    CapabilityType["PLANNING"] = "planning";
    CapabilityType["LEARNING"] = "learning";
    CapabilityType["MEMORY"] = "memory";
    CapabilityType["DECISION_MAKING"] = "decision_making";
    // Functional Capabilities
    CapabilityType["CODE_GENERATION"] = "code_generation";
    CapabilityType["CODE_ANALYSIS"] = "code_analysis";
    CapabilityType["CONTENT_CREATION"] = "content_creation";
    CapabilityType["DATA_ANALYSIS"] = "data_analysis";
    CapabilityType["WORKFLOW_ORCHESTRATION"] = "workflow_orchestration";
    CapabilityType["EXECUTION_AGENT"] = "execution_agent";
    // Integration Capabilities
    CapabilityType["API_INTEGRATION"] = "api_integration";
    CapabilityType["FILE_OPERATIONS"] = "file_operations";
    CapabilityType["SYSTEM_COMMANDS"] = "system_commands";
    CapabilityType["PROTOCOL_TRANSLATION"] = "protocol_translation";
    CapabilityType["DATABASE_OPERATIONS"] = "database_operations";
    // Communication Capabilities
    CapabilityType["NATURAL_LANGUAGE"] = "natural_language";
    CapabilityType["MULTIMODAL"] = "multimodal";
    CapabilityType["REAL_TIME_CHAT"] = "real_time_chat";
    CapabilityType["ASYNC_MESSAGING"] = "async_messaging";
    // Specialized Capabilities
    CapabilityType["SECURITY_ANALYSIS"] = "security_analysis";
    CapabilityType["PERFORMANCE_OPTIMIZATION"] = "performance_optimization";
    CapabilityType["ERROR_HANDLING"] = "error_handling";
    CapabilityType["MONITORING"] = "monitoring";
})(CapabilityType || (exports.CapabilityType = CapabilityType = {}));
class Capability {
    type;
    level;
    confidence;
    metadata;
    constructor(type, level, confidence, // 0-1
    metadata = {}) {
        this.type = type;
        this.level = level;
        this.confidence = confidence;
        this.metadata = metadata;
        if (confidence < 0 || confidence > 1) {
            throw new Error('Capability confidence must be between 0 and 1');
        }
    }
    isCompatibleWith(other) {
        return this.type === other.type && Math.abs(this.confidence - other.confidence) < 0.3;
    }
}
exports.Capability = Capability;
class CapabilitySet {
    capabilities = new Map();
    constructor(capabilities = []) {
        capabilities.forEach(cap => this.addCapability(cap));
    }
    addCapability(capability) {
        this.capabilities.set(capability.type, capability);
    }
    hasCapability(type) {
        return this.capabilities.has(type);
    }
    getCapability(type) {
        return this.capabilities.get(type);
    }
    getAllCapabilities() {
        return Array.from(this.capabilities.values());
    }
    calculateOverlapWith(other) {
        const thisTypes = new Set(this.capabilities.keys());
        const otherTypes = new Set(other.capabilities.keys());
        const intersection = new Set([...thisTypes].filter(x => otherTypes.has(x)));
        const union = new Set([...thisTypes, ...otherTypes]);
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    getCapabilityScore() {
        const capabilities = this.getAllCapabilities();
        if (capabilities.length === 0)
            return 0;
        return capabilities.reduce((sum, cap) => sum + cap.confidence, 0) / capabilities.length;
    }
}
exports.CapabilitySet = CapabilitySet;
var DiscoverySource;
(function (DiscoverySource) {
    DiscoverySource["CLAUDE_MARKDOWN"] = "claude_markdown";
    DiscoverySource["PYDANTIC_PYTHON"] = "pydantic_python";
    DiscoverySource["MCP_SERVER"] = "mcp_server";
    DiscoverySource["VSCODE_EXTENSION"] = "vscode_extension";
    DiscoverySource["API_SERVICE"] = "api_service";
    DiscoverySource["CONFIGURATION_FILE"] = "configuration_file";
    DiscoverySource["RUNTIME_DISCOVERY"] = "runtime_discovery";
    DiscoverySource["MANUAL_REGISTRATION"] = "manual_registration";
})(DiscoverySource || (exports.DiscoverySource = DiscoverySource = {}));
class EntityMetadata {
    discoverySource;
    discoveredAt;
    lastUpdated;
    filePath;
    sourceCode;
    configuration;
    tags;
    customProperties;
    constructor(discoverySource, discoveredAt, lastUpdated, filePath, sourceCode, configuration, tags = [], customProperties = {}) {
        this.discoverySource = discoverySource;
        this.discoveredAt = discoveredAt;
        this.lastUpdated = lastUpdated;
        this.filePath = filePath;
        this.sourceCode = sourceCode;
        this.configuration = configuration;
        this.tags = tags;
        this.customProperties = customProperties;
    }
    addTag(tag) {
        return new EntityMetadata(this.discoverySource, this.discoveredAt, new Date(), this.filePath, this.sourceCode, this.configuration, [...this.tags, tag], this.customProperties);
    }
    updateProperty(key, value) {
        return new EntityMetadata(this.discoverySource, this.discoveredAt, new Date(), this.filePath, this.sourceCode, this.configuration, this.tags, { ...this.customProperties, [key]: value });
    }
}
exports.EntityMetadata = EntityMetadata;
// Domain Events
class EntityDiscoveredEvent {
    entityId;
    discoverySource;
    timestamp;
    constructor(entityId, discoverySource, timestamp = new Date()) {
        this.entityId = entityId;
        this.discoverySource = discoverySource;
        this.timestamp = timestamp;
    }
}
exports.EntityDiscoveredEvent = EntityDiscoveredEvent;
class EntityCapabilitiesUpdatedEvent {
    entityId;
    oldCapabilities;
    newCapabilities;
    timestamp;
    constructor(entityId, oldCapabilities, newCapabilities, timestamp = new Date()) {
        this.entityId = entityId;
        this.oldCapabilities = oldCapabilities;
        this.newCapabilities = newCapabilities;
        this.timestamp = timestamp;
    }
}
exports.EntityCapabilitiesUpdatedEvent = EntityCapabilitiesUpdatedEvent;
class EntityRelationshipDetectedEvent {
    sourceEntityId;
    targetEntityId;
    relationshipType;
    confidence;
    timestamp;
    constructor(sourceEntityId, targetEntityId, relationshipType, confidence, timestamp = new Date()) {
        this.sourceEntityId = sourceEntityId;
        this.targetEntityId = targetEntityId;
        this.relationshipType = relationshipType;
        this.confidence = confidence;
        this.timestamp = timestamp;
    }
}
exports.EntityRelationshipDetectedEvent = EntityRelationshipDetectedEvent;
// Main Aggregate Root
class UnifiedEntity extends cqrs_1.AggregateRoot {
    id;
    identity;
    archetype;
    capabilities;
    metadata;
    semanticEmbedding;
    isActive;
    constructor(id, identity, archetype, capabilities, metadata, semanticEmbedding, isActive = true) {
        super();
        this.id = id;
        this.identity = identity;
        this.archetype = archetype;
        this.capabilities = capabilities;
        this.metadata = metadata;
        this.semanticEmbedding = semanticEmbedding;
        this.isActive = isActive;
    }
    static create(identity, archetype, capabilities, metadata) {
        const id = EntityId.generate();
        const entity = new UnifiedEntity(id, identity, archetype, capabilities, metadata);
        entity.apply(new EntityDiscoveredEvent(id, metadata.discoverySource));
        return entity;
    }
    updateCapabilities(newCapabilities) {
        const oldCapabilities = this.capabilities;
        // Create new entity with updated capabilities
        const updatedEntity = new UnifiedEntity(this.id, this.identity, this.archetype, newCapabilities, new EntityMetadata(this.metadata.discoverySource, this.metadata.discoveredAt, new Date(), this.metadata.filePath, this.metadata.sourceCode, this.metadata.configuration, this.metadata.tags, this.metadata.customProperties), this.semanticEmbedding, this.isActive);
        this.apply(new EntityCapabilitiesUpdatedEvent(this.id, oldCapabilities, newCapabilities));
    }
    calculateSimilarityWith(other) {
        // Multi-dimensional similarity calculation
        const capabilityOverlap = this.capabilities.calculateOverlapWith(other.capabilities);
        const archetypeMatch = this.archetype === other.archetype ? 1 : 0;
        const sourceMatch = this.metadata.discoverySource === other.metadata.discoverySource ? 0.5 : 0;
        // Weighted similarity score
        return (capabilityOverlap * 0.6) + (archetypeMatch * 0.3) + (sourceMatch * 0.1);
    }
    isCompatibleWith(other) {
        return this.calculateSimilarityWith(other) > 0.3;
    }
    canCollaborateWith(other) {
        // Check for complementary capabilities
        const myCapabilities = new Set(this.capabilities.getAllCapabilities().map(c => c.type));
        const otherCapabilities = new Set(other.capabilities.getAllCapabilities().map(c => c.type));
        // Look for complementary capabilities (different but compatible)
        const hasComplementary = Array.from(myCapabilities).some(myType => {
            return Array.from(otherCapabilities).some(otherType => {
                return this.areCapabilitiesComplementary(myType, otherType);
            });
        });
        return hasComplementary || this.calculateSimilarityWith(other) > 0.5;
    }
    areCapabilitiesComplementary(type1, type2) {
        const complementaryPairs = [
            [CapabilityType.CODE_GENERATION, CapabilityType.CODE_ANALYSIS],
            [CapabilityType.PLANNING, CapabilityType.EXECUTION_AGENT],
            [CapabilityType.CONTENT_CREATION, CapabilityType.DATA_ANALYSIS],
            [CapabilityType.REASONING, CapabilityType.DECISION_MAKING]
        ];
        return complementaryPairs.some(pair => (pair[0] === type1 && pair[1] === type2) ||
            (pair[1] === type1 && pair[0] === type2));
    }
    deactivate() {
        // Create deactivated version
        const deactivatedEntity = new UnifiedEntity(this.id, this.identity, this.archetype, this.capabilities, this.metadata, this.semanticEmbedding, false);
    }
    toJSON() {
        return {
            id: this.id.value,
            identity: {
                name: this.identity.name,
                displayName: this.identity.displayName,
                description: this.identity.description,
                version: this.identity.version,
                namespace: this.identity.namespace
            },
            archetype: this.archetype,
            capabilities: this.capabilities.getAllCapabilities().map(cap => ({
                type: cap.type,
                level: cap.level,
                confidence: cap.confidence,
                metadata: cap.metadata
            })),
            metadata: {
                discoverySource: this.metadata.discoverySource,
                discoveredAt: this.metadata.discoveredAt.toISOString(),
                lastUpdated: this.metadata.lastUpdated.toISOString(),
                filePath: this.metadata.filePath,
                tags: this.metadata.tags,
                customProperties: this.metadata.customProperties
            },
            semanticEmbedding: this.semanticEmbedding,
            isActive: this.isActive
        };
    }
}
exports.UnifiedEntity = UnifiedEntity;
//# sourceMappingURL=UnifiedEntity.js.map