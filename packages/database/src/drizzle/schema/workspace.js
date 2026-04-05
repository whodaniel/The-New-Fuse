"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceAllocationsRelations = exports.agentMemoriesRelations = exports.collectionItemsRelations = exports.projectCollectionsRelations = exports.projectDocumentsRelations = exports.projectsRelations = exports.workspaceBookmarksRelations = exports.workspaceDomainsRelations = exports.workspaceMembersRelations = exports.workspacesRelations = exports.syncConflicts = exports.syncStates = exports.resourceAllocations = exports.agentMemories = exports.collectionItems = exports.projectCollections = exports.projectDocuments = exports.projects = exports.workspaceBookmarks = exports.workspaceDomains = exports.workspaceDomainStatusEnum = exports.workspaceMembers = exports.workspaceMemberRoleEnum = exports.workspaces = void 0;
/**
 * Drizzle ORM Schema - Workspace, Project, Memory, Sync
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
// =============================================================================
// WORKSPACE
// =============================================================================
exports.workspaces = (0, pg_core_1.pgTable)('workspaces', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    ownerId: (0, pg_core_1.text)('owner_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.workspaceMemberRoleEnum = (0, pg_core_1.pgEnum)('WorkspaceMemberRole', [
    'owner',
    'admin',
    'member',
    'viewer',
]);
exports.workspaceMembers = (0, pg_core_1.pgTable)('workspace_members', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    workspaceId: (0, pg_core_1.text)('workspace_id')
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    role: (0, exports.workspaceMemberRoleEnum)('role').default('member').notNull(),
    addedByUserId: (0, pg_core_1.text)('added_by_user_id').references(() => users_1.users.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    uniqueMember: (0, pg_core_1.unique)().on(table.workspaceId, table.userId),
}));
exports.workspaceDomainStatusEnum = (0, pg_core_1.pgEnum)('WorkspaceDomainStatus', [
    'pending',
    'verified',
    'error',
]);
exports.workspaceDomains = (0, pg_core_1.pgTable)('workspace_domains', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    workspaceId: (0, pg_core_1.text)('workspace_id')
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: 'cascade' }),
    domain: (0, pg_core_1.varchar)('domain', { length: 255 }).notNull(),
    status: (0, exports.workspaceDomainStatusEnum)('status').default('pending').notNull(),
    verificationMessage: (0, pg_core_1.text)('verification_message'),
    createdByUserId: (0, pg_core_1.text)('created_by_user_id').references(() => users_1.users.id, {
        onDelete: 'set null',
    }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    uniqueWorkspaceDomain: (0, pg_core_1.unique)().on(table.workspaceId, table.domain),
}));
exports.workspaceBookmarks = (0, pg_core_1.pgTable)('workspace_bookmarks', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    workspaceId: (0, pg_core_1.text)('workspace_id')
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: 'cascade' }),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    url: (0, pg_core_1.text)('url').notNull(),
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]).notNull(),
    note: (0, pg_core_1.text)('note'),
    createdByUserId: (0, pg_core_1.text)('created_by_user_id').references(() => users_1.users.id, {
        onDelete: 'set null',
    }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    uniqueWorkspaceBookmarkUserUrl: (0, pg_core_1.unique)().on(table.workspaceId, table.createdByUserId, table.url),
}));
// =============================================================================
// PROJECT
// =============================================================================
exports.projects = (0, pg_core_1.pgTable)('projects', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    workspaceId: (0, pg_core_1.text)('workspace_id')
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: 'cascade' }),
    // Custom instructions for the project (Claude-style)
    customInstructions: (0, pg_core_1.text)('custom_instructions'),
    // Model Context Protocol (MCP) configuration
    mcpConfig: (0, pg_core_1.jsonb)('mcp_config'),
    // Environment-based API keys (Dev/Staging/Prod)
    environmentKeys: (0, pg_core_1.jsonb)('environment_keys'),
    // Resource quotas for billing/limits
    resourceQuotas: (0, pg_core_1.jsonb)('resource_quotas'),
    // General project settings
    settings: (0, pg_core_1.jsonb)('settings'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// PROJECT DOCUMENTS (Dedicated Document Libraries)
// =============================================================================
exports.projectDocuments = (0, pg_core_1.pgTable)('project_documents', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .notNull()
        .references(() => exports.projects.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    content: (0, pg_core_1.text)('content').notNull(), // or use a specialized storage reference
    type: (0, pg_core_1.varchar)('type', { length: 50 }).default('text'), // text, pdf, code, etc.
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// PROJECT COLLECTIONS (Notebooks/Knowledge Collections)
// =============================================================================
exports.projectCollections = (0, pg_core_1.pgTable)('project_collections', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .notNull()
        .references(() => exports.projects.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// COLLECTION ITEMS (Items within Collections)
// =============================================================================
exports.collectionItems = (0, pg_core_1.pgTable)('collection_items', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    collectionId: (0, pg_core_1.uuid)('collection_id')
        .notNull()
        .references(() => exports.projectCollections.id, { onDelete: 'cascade' }),
    // Optional link to a project document
    documentId: (0, pg_core_1.uuid)('document_id').references(() => exports.projectDocuments.id, { onDelete: 'set null' }),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(), // document_ref, snippet, note
    content: (0, pg_core_1.text)('content'), // For snippets or notes that aren't full documents
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// AGENT MEMORY
// =============================================================================
exports.agentMemories = (0, pg_core_1.pgTable)('agent_memories', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    key: (0, pg_core_1.varchar)('key', { length: 255 }).notNull(),
    value: (0, pg_core_1.jsonb)('value').notNull(),
    agentId: (0, pg_core_1.uuid)('agent_id'),
    projectId: (0, pg_core_1.uuid)('project_id')
        .notNull()
        .references(() => exports.projects.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// RESOURCE ALLOCATION
// =============================================================================
exports.resourceAllocations = (0, pg_core_1.pgTable)('resource_allocations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    resourceType: (0, pg_core_1.varchar)('resource_type', { length: 100 }).notNull(),
    resourceId: (0, pg_core_1.varchar)('resource_id', { length: 255 }).notNull(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .notNull()
        .references(() => exports.projects.id, { onDelete: 'cascade' }),
    allocatedAt: (0, pg_core_1.timestamp)('allocated_at').defaultNow().notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata'),
});
// =============================================================================
// SYNC STATE
// =============================================================================
exports.syncStates = (0, pg_core_1.pgTable)('sync_states', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    resourceType: (0, pg_core_1.varchar)('resource_type', { length: 100 }).notNull(),
    resourceId: (0, pg_core_1.varchar)('resource_id', { length: 255 }).notNull(),
    tenantId: (0, pg_core_1.varchar)('tenant_id', { length: 255 }),
    version: (0, pg_core_1.integer)('version').notNull(),
    checksum: (0, pg_core_1.varchar)('checksum', { length: 64 }).notNull(),
    lastSync: (0, pg_core_1.timestamp)('last_sync').notNull(),
    syncedBy: (0, pg_core_1.varchar)('synced_by', { length: 255 }).notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').notNull(),
}, (table) => ({
    uniqueResource: (0, pg_core_1.unique)().on(table.resourceType, table.resourceId, table.tenantId),
}));
// =============================================================================
// SYNC CONFLICT
// =============================================================================
exports.syncConflicts = (0, pg_core_1.pgTable)('sync_conflicts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    resourceType: (0, pg_core_1.varchar)('resource_type', { length: 100 }).notNull(),
    resourceId: (0, pg_core_1.varchar)('resource_id', { length: 255 }).notNull(),
    tenantId: (0, pg_core_1.varchar)('tenant_id', { length: 255 }),
    conflictType: (0, pg_core_1.varchar)('conflict_type', { length: 50 }).notNull(),
    localVersion: (0, pg_core_1.jsonb)('local_version').notNull(),
    remoteVersion: (0, pg_core_1.jsonb)('remote_version').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at'),
    resolvedBy: (0, pg_core_1.varchar)('resolved_by', { length: 255 }),
    resolution: (0, pg_core_1.jsonb)('resolution'),
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.workspacesRelations = (0, drizzle_orm_1.relations)(exports.workspaces, ({ one, many }) => ({
    owner: one(users_1.users, {
        fields: [exports.workspaces.ownerId],
        references: [users_1.users.id],
    }),
    projects: many(exports.projects),
    members: many(exports.workspaceMembers),
    domains: many(exports.workspaceDomains),
    bookmarks: many(exports.workspaceBookmarks),
}));
exports.workspaceMembersRelations = (0, drizzle_orm_1.relations)(exports.workspaceMembers, ({ one }) => ({
    workspace: one(exports.workspaces, {
        fields: [exports.workspaceMembers.workspaceId],
        references: [exports.workspaces.id],
    }),
    user: one(users_1.users, {
        fields: [exports.workspaceMembers.userId],
        references: [users_1.users.id],
    }),
    addedBy: one(users_1.users, {
        fields: [exports.workspaceMembers.addedByUserId],
        references: [users_1.users.id],
    }),
}));
exports.workspaceDomainsRelations = (0, drizzle_orm_1.relations)(exports.workspaceDomains, ({ one }) => ({
    workspace: one(exports.workspaces, {
        fields: [exports.workspaceDomains.workspaceId],
        references: [exports.workspaces.id],
    }),
    createdBy: one(users_1.users, {
        fields: [exports.workspaceDomains.createdByUserId],
        references: [users_1.users.id],
    }),
}));
exports.workspaceBookmarksRelations = (0, drizzle_orm_1.relations)(exports.workspaceBookmarks, ({ one }) => ({
    workspace: one(exports.workspaces, {
        fields: [exports.workspaceBookmarks.workspaceId],
        references: [exports.workspaces.id],
    }),
    createdBy: one(users_1.users, {
        fields: [exports.workspaceBookmarks.createdByUserId],
        references: [users_1.users.id],
    }),
}));
exports.projectsRelations = (0, drizzle_orm_1.relations)(exports.projects, ({ one, many }) => ({
    workspace: one(exports.workspaces, {
        fields: [exports.projects.workspaceId],
        references: [exports.workspaces.id],
    }),
    agentMemories: many(exports.agentMemories),
    resourceAllocations: many(exports.resourceAllocations),
    documents: many(exports.projectDocuments),
    collections: many(exports.projectCollections),
}));
exports.projectDocumentsRelations = (0, drizzle_orm_1.relations)(exports.projectDocuments, ({ one }) => ({
    project: one(exports.projects, {
        fields: [exports.projectDocuments.projectId],
        references: [exports.projects.id],
    }),
}));
exports.projectCollectionsRelations = (0, drizzle_orm_1.relations)(exports.projectCollections, ({ one, many }) => ({
    project: one(exports.projects, {
        fields: [exports.projectCollections.projectId],
        references: [exports.projects.id],
    }),
    items: many(exports.collectionItems),
}));
exports.collectionItemsRelations = (0, drizzle_orm_1.relations)(exports.collectionItems, ({ one }) => ({
    collection: one(exports.projectCollections, {
        fields: [exports.collectionItems.collectionId],
        references: [exports.projectCollections.id],
    }),
    document: one(exports.projectDocuments, {
        fields: [exports.collectionItems.documentId],
        references: [exports.projectDocuments.id],
    }),
}));
exports.agentMemoriesRelations = (0, drizzle_orm_1.relations)(exports.agentMemories, ({ one }) => ({
    project: one(exports.projects, {
        fields: [exports.agentMemories.projectId],
        references: [exports.projects.id],
    }),
}));
exports.resourceAllocationsRelations = (0, drizzle_orm_1.relations)(exports.resourceAllocations, ({ one }) => ({
    project: one(exports.projects, {
        fields: [exports.resourceAllocations.projectId],
        references: [exports.projects.id],
    }),
}));
//# sourceMappingURL=workspace.js.map