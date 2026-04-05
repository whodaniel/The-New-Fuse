"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authEventsRelations = exports.loginAttemptsRelations = exports.authSessionsRelations = exports.registrationInviteCodesRelations = exports.usersRelations = exports.authEvents = exports.loginAttempts = exports.authSessions = exports.registrationInviteCodes = exports.inviteCodeStatusEnum = exports.users = void 0;
/**
 * Drizzle ORM Schema - User Management & Authentication
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const agents_1 = require("./agents");
const enums_1 = require("./enums");
const workspace_1 = require("./workspace");
// =============================================================================
// USER
// =============================================================================
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).unique().notNull(),
    username: (0, pg_core_1.varchar)('username', { length: 255 }).unique(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    hashedPassword: (0, pg_core_1.varchar)('hashed_password', { length: 255 }).notNull(),
    role: (0, enums_1.userRoleEnum)('role').default('USER').notNull(),
    roles: (0, pg_core_1.jsonb)('roles').$type().default(['USER']).notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    lastLogin: (0, pg_core_1.timestamp)('last_login'),
    preferences: (0, pg_core_1.jsonb)('preferences'),
    refreshToken: (0, pg_core_1.text)('refresh_token'),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
    emailVerified: (0, pg_core_1.boolean)('email_verified').default(false).notNull(),
    verificationToken: (0, pg_core_1.varchar)('verification_token', { length: 255 }),
    verificationExpires: (0, pg_core_1.timestamp)('verification_expires'),
    walletAddress: (0, pg_core_1.varchar)('wallet_address', { length: 255 }).unique(),
});
exports.inviteCodeStatusEnum = (0, pg_core_1.pgEnum)('InviteCodeStatus', ['ACTIVE', 'DISABLED']);
exports.registrationInviteCodes = (0, pg_core_1.pgTable)('registration_invite_codes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    code: (0, pg_core_1.varchar)('code', { length: 128 }).unique().notNull(),
    label: (0, pg_core_1.varchar)('label', { length: 255 }),
    federationId: (0, pg_core_1.varchar)('federation_id', { length: 255 }),
    status: (0, exports.inviteCodeStatusEnum)('status').notNull().default('ACTIVE'),
    maxUses: (0, pg_core_1.integer)('max_uses').default(1).notNull(),
    usedCount: (0, pg_core_1.integer)('used_count').default(0).notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    lastUsedAt: (0, pg_core_1.timestamp)('last_used_at'),
    createdByUserId: (0, pg_core_1.uuid)('created_by_user_id').references(() => exports.users.id, { onDelete: 'set null' }),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// AUTH SESSION
// =============================================================================
exports.authSessions = (0, pg_core_1.pgTable)('auth_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    token: (0, pg_core_1.varchar)('token', { length: 512 }).unique().notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =============================================================================
// LOGIN ATTEMPT
// =============================================================================
exports.loginAttempts = (0, pg_core_1.pgTable)('login_attempts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }).notNull(),
    successful: (0, pg_core_1.boolean)('successful').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =============================================================================
// AUTH EVENT
// =============================================================================
exports.authEvents = (0, pg_core_1.pgTable)('auth_events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(),
    details: (0, pg_core_1.jsonb)('details'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    authSessions: many(exports.authSessions),
    loginAttempts: many(exports.loginAttempts),
    authEvents: many(exports.authEvents),
    createdInviteCodes: many(exports.registrationInviteCodes),
    agents: many(agents_1.agents),
    workspaces: many(workspace_1.workspaces),
    workspaceMemberships: many(workspace_1.workspaceMembers),
}));
exports.registrationInviteCodesRelations = (0, drizzle_orm_1.relations)(exports.registrationInviteCodes, ({ one }) => ({
    createdBy: one(exports.users, {
        fields: [exports.registrationInviteCodes.createdByUserId],
        references: [exports.users.id],
    }),
}));
exports.authSessionsRelations = (0, drizzle_orm_1.relations)(exports.authSessions, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.authSessions.userId],
        references: [exports.users.id],
    }),
}));
exports.loginAttemptsRelations = (0, drizzle_orm_1.relations)(exports.loginAttempts, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.loginAttempts.userId],
        references: [exports.users.id],
    }),
}));
exports.authEventsRelations = (0, drizzle_orm_1.relations)(exports.authEvents, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.authEvents.userId],
        references: [exports.users.id],
    }),
}));
//# sourceMappingURL=users.js.map