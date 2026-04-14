/**
 * Drizzle ORM Schema - Workspace, Project, Memory, Sync
 */
import { relations } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// =============================================================================
// WORKSPACE
// =============================================================================

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workspaceMemberRoleEnum = pgEnum('WorkspaceMemberRole', [
  'owner',
  'admin',
  'member',
  'viewer',
]);

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: workspaceMemberRoleEnum('role').default('member').notNull(),
    addedByUserId: text('added_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueMember: unique().on(table.workspaceId, table.userId),
  })
);

export const workspaceDomainStatusEnum = pgEnum('workspace_domain_status', [
  'pending',
  'verified',
  'error',
]);

export const workspaceDomains = pgTable('workspace_domains', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  domain: varchar('domain', { length: 255 }).notNull(),
  status: workspaceDomainStatusEnum('status').default('pending').notNull(),
  verificationMessage: text('verification_message'),
  createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workspaceBookmarks = pgTable('workspace_bookmarks', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  url: text('url').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  note: text('note'),
  createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// PROJECT
// =============================================================================

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),

  // Custom instructions for the project (Claude-style)
  customInstructions: text('custom_instructions'),

  // Model Context Protocol (MCP) configuration
  mcpConfig: jsonb('mcp_config'),

  // Environment-based API keys (Dev/Staging/Prod)
  environmentKeys: jsonb('environment_keys'),

  // Resource quotas for billing/limits
  resourceQuotas: jsonb('resource_quotas'),

  // General project settings
  settings: jsonb('settings'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// PROJECT DOCUMENTS (Dedicated Document Libraries)
// =============================================================================

export const projectDocuments = pgTable('project_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  content: text('content').notNull(), // or use a specialized storage reference
  type: varchar('type', { length: 50 }).default('text'), // text, pdf, code, etc.
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// PROJECT COLLECTIONS (Notebooks/Knowledge Collections)
// =============================================================================

export const projectCollections = pgTable('project_collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// COLLECTION ITEMS (Items within Collections)
// =============================================================================

export const collectionItems = pgTable('collection_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id')
    .notNull()
    .references(() => projectCollections.id, { onDelete: 'cascade' }),
  // Optional link to a project document
  documentId: uuid('document_id').references(() => projectDocuments.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 50 }).notNull(), // document_ref, snippet, note
  content: text('content'), // For snippets or notes that aren't full documents
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// AGENT MEMORY
// =============================================================================

export const agentMemories = pgTable('agent_memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull(),
  value: jsonb('value').notNull(),
  agentId: uuid('agent_id'),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// RESOURCE ALLOCATION
// =============================================================================

export const resourceAllocations = pgTable('resource_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }).notNull(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  allocatedAt: timestamp('allocated_at').defaultNow().notNull(),
  metadata: jsonb('metadata'),
});

// =============================================================================
// SYNC STATE
// =============================================================================

export const syncStates = pgTable(
  'sync_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    resourceId: varchar('resource_id', { length: 255 }).notNull(),
    tenantId: varchar('tenant_id', { length: 255 }),
    version: integer('version').notNull(),
    checksum: varchar('checksum', { length: 64 }).notNull(),
    lastSync: timestamp('last_sync').notNull(),
    syncedBy: varchar('synced_by', { length: 255 }).notNull(),
    metadata: jsonb('metadata').notNull(),
  },
  (table) => ({
    uniqueResource: unique().on(table.resourceType, table.resourceId, table.tenantId),
  })
);

// =============================================================================
// SYNC CONFLICT
// =============================================================================

export const syncConflicts = pgTable('sync_conflicts', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }),
  conflictType: varchar('conflict_type', { length: 50 }).notNull(),
  localVersion: jsonb('local_version').notNull(),
  remoteVersion: jsonb('remote_version').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: varchar('resolved_by', { length: 255 }),
  resolution: jsonb('resolution'),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  projects: many(projects),
  members: many(workspaceMembers),
  domains: many(workspaceDomains),
  bookmarks: many(workspaceBookmarks),
}));

export const workspaceDomainsRelations = relations(workspaceDomains, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceDomains.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [workspaceDomains.createdByUserId],
    references: [users.id],
  }),
}));

export const workspaceBookmarksRelations = relations(workspaceBookmarks, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceBookmarks.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [workspaceBookmarks.createdByUserId],
    references: [users.id],
  }),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
  addedBy: one(users, {
    fields: [workspaceMembers.addedByUserId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  agentMemories: many(agentMemories),
  resourceAllocations: many(resourceAllocations),
  documents: many(projectDocuments),
  collections: many(projectCollections),
}));

export const projectDocumentsRelations = relations(projectDocuments, ({ one }) => ({
  project: one(projects, {
    fields: [projectDocuments.projectId],
    references: [projects.id],
  }),
}));

export const projectCollectionsRelations = relations(projectCollections, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectCollections.projectId],
    references: [projects.id],
  }),
  items: many(collectionItems),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(projectCollections, {
    fields: [collectionItems.collectionId],
    references: [projectCollections.id],
  }),
  document: one(projectDocuments, {
    fields: [collectionItems.documentId],
    references: [projectDocuments.id],
  }),
}));

export const agentMemoriesRelations = relations(agentMemories, ({ one }) => ({
  project: one(projects, {
    fields: [agentMemories.projectId],
    references: [projects.id],
  }),
}));

export const resourceAllocationsRelations = relations(resourceAllocations, ({ one }) => ({
  project: one(projects, {
    fields: [resourceAllocations.projectId],
    references: [projects.id],
  }),
}));
