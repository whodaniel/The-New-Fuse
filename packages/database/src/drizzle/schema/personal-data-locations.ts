import { relations, sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { projects, workspaces } from './workspace.js';

export const userDataLocationProviderEnum = pgEnum('UserDataLocationProvider', [
  'google_drive',
  'dropbox',
  'box',
  'onedrive',
  'customer_s3_or_r2',
  'private_github_repo',
  'local_device_reference',
  'other_url',
]);

export const userDataLocationKindEnum = pgEnum('UserDataLocationKind', [
  'document_library',
  'media_library',
  'exports',
  'backups',
  'project_assets',
  'generated_outputs',
  'client_artifacts',
  'personal_business_artifacts',
]);

export const userDataClassificationEnum = pgEnum('UserDataClassification', [
  'personal',
  'business',
  'client',
  'confidential',
  'public',
]);

export const userDataLocationConsentStatusEnum = pgEnum('UserDataLocationConsentStatus', [
  'active',
  'pending',
  'revoked',
  'expired',
]);

export const userDataLocationSyncStatusEnum = pgEnum('UserDataLocationSyncStatus', [
  'active',
  'paused',
  'reauth_required',
  'disconnected',
  'deleted',
]);

export const userDataLocations = pgTable(
  'user_data_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'set null' }),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
    provider: userDataLocationProviderEnum('provider').notNull(),
    locationKind: userDataLocationKindEnum('location_kind').notNull(),
    providerAccountLabel: varchar('provider_account_label', { length: 255 }),
    externalLocationId: varchar('external_location_id', { length: 512 }),
    externalUrl: text('external_url'),
    rootPathHint: text('root_path_hint'),
    dataClassification: userDataClassificationEnum('data_classification').default('business').notNull(),
    consentStatus: userDataLocationConsentStatusEnum('consent_status')
      .default('pending')
      .notNull(),
    syncStatus: userDataLocationSyncStatusEnum('sync_status').default('paused').notNull(),
    oauthSecretRef: varchar('oauth_secret_ref', { length: 255 }),
    retentionPolicy: varchar('retention_policy', { length: 120 }),
    hashAndProvenanceMetadata: jsonb('hash_and_provenance_metadata')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    lastIndexedAt: timestamp('last_indexed_at'),
    lastVerifiedAt: timestamp('last_verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('user_data_locations_user_idx').on(table.userId),
    workspaceIdx: index('user_data_locations_workspace_idx').on(table.workspaceId),
    projectIdx: index('user_data_locations_project_idx').on(table.projectId),
    providerStatusIdx: index('user_data_locations_provider_status_idx').on(
      table.provider,
      table.consentStatus,
      table.syncStatus
    ),
    verificationIdx: index('user_data_locations_verification_idx').on(table.lastVerifiedAt),
    externalLocationUniqueIdx: uniqueIndex('user_data_locations_external_location_uq')
      .on(table.userId, table.provider, table.externalLocationId)
      .where(sql`${table.externalLocationId} IS NOT NULL`),
  })
);

export const userDataLocationsRelations = relations(userDataLocations, ({ one }) => ({
  user: one(users, {
    fields: [userDataLocations.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [userDataLocations.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [userDataLocations.projectId],
    references: [projects.id],
  }),
}));
