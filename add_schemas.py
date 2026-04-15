import re

filepath = 'packages/database/src/drizzle/schema/workspace.ts'
with open(filepath, 'r') as f:
    content = f.read()

schemas_to_add = """
// =============================================================================
// WORKSPACE DOMAINS
// =============================================================================

export const workspaceDomainStatusEnum = pgEnum('WorkspaceDomainStatus', [
  'pending',
  'verified',
  'failed',
]);

export const workspaceDomains = pgTable('workspace_domains', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  status: workspaceDomainStatusEnum('status').default('pending').notNull(),
  verificationToken: varchar('verification_token', { length: 255 }).notNull(),
  verificationMessage: text('verification_message'),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// WORKSPACE BOOKMARKS
// =============================================================================

export const workspaceBookmarks = pgTable('workspace_bookmarks', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 2048 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  faviconUrl: varchar('favicon_url', { length: 2048 }),
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata'),
  isPublic: boolean('is_public').default(false).notNull(),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
"""

if "workspaceDomains" not in content:
    content = content.replace("// =============================================================================", schemas_to_add + "\n// =============================================================================", 1)

    # Adding to workspacesRelations
    relations_addition = """
  domains: many(workspaceDomains),
  bookmarks: many(workspaceBookmarks),
"""
    content = content.replace("members: many(workspaceMembers),\n}));", "members: many(workspaceMembers)," + relations_addition + "}));")

    # Adding workspaceDomainsRelations and workspaceBookmarksRelations
    extra_relations = """
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
"""
    content += extra_relations

    # Fix missing boolean
    if "import {" in content and "boolean" not in content.split("from 'drizzle-orm/pg-core'")[0]:
        content = content.replace("varchar,", "varchar, boolean,")

    with open(filepath, 'w') as f:
        f.write(content)
