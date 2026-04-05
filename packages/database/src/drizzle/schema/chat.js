"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoomsRelations = exports.readReceiptsRelations = exports.chatRoomParticipantsRelations = exports.readReceipts = exports.chatRoomParticipants = exports.messagesRelations = exports.chatsRelations = exports.chatMessages = exports.messages = exports.chatRooms = exports.chats = void 0;
/**
 * Drizzle ORM Schema - Chat System
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const agents_1 = require("./agents");
const enums_1 = require("./enums");
const users_1 = require("./users");
const workspace_1 = require("./workspace");
// =============================================================================
// CHAT
// =============================================================================
exports.chats = (0, pg_core_1.pgTable)('chats', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }),
    agentId: (0, pg_core_1.uuid)('agent_id')
        .notNull()
        .references(() => agents_1.agents.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id'),
    projectId: (0, pg_core_1.uuid)('project_id').references(() => workspace_1.projects.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
// =============================================================================
// CHAT ROOM
// =============================================================================
exports.chatRooms = (0, pg_core_1.pgTable)('chat_rooms', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    topic: (0, pg_core_1.text)('topic'),
    purpose: (0, pg_core_1.text)('purpose'),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).default('GENERAL'),
    isPrivate: (0, pg_core_1.boolean)('is_private').default(false).notNull(),
    isEphemeral: (0, pg_core_1.boolean)('is_ephemeral').default(false).notNull(),
    maxParticipants: (0, pg_core_1.integer)('max_participants').default(50),
    ownerId: (0, pg_core_1.uuid)('owner_id')
        .notNull()
        .references(() => users_1.users.id),
    settings: (0, pg_core_1.jsonb)('settings'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    lastMessageAt: (0, pg_core_1.timestamp)('last_message_at'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
// =============================================================================
// MESSAGE
// =============================================================================
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    content: (0, pg_core_1.text)('content').notNull(),
    role: (0, enums_1.messageRoleEnum)('role').default('USER').notNull(),
    senderId: (0, pg_core_1.uuid)('sender_id').references(() => users_1.users.id),
    senderName: (0, pg_core_1.varchar)('sender_name', { length: 255 }),
    agentId: (0, pg_core_1.uuid)('agent_id').references(() => agents_1.agents.id),
    chatId: (0, pg_core_1.uuid)('chat_id').references(() => exports.chats.id),
    roomId: (0, pg_core_1.uuid)('room_id').references(() => exports.chatRooms.id),
    parentMessageId: (0, pg_core_1.uuid)('parent_message_id'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    attachments: (0, pg_core_1.jsonb)('attachments').$type().default([]).notNull(),
    timestamp: (0, pg_core_1.timestamp)('timestamp').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    isEdited: (0, pg_core_1.boolean)('is_edited').default(false).notNull(),
    isDeleted: (0, pg_core_1.boolean)('is_deleted').default(false).notNull(),
    isEphemeral: (0, pg_core_1.boolean)('is_ephemeral').default(false).notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    reactions: (0, pg_core_1.jsonb)('reactions'),
});
// =============================================================================
// CHAT MESSAGE (Ephemeral)
// =============================================================================
exports.chatMessages = (0, pg_core_1.pgTable)('chat_messages', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull(),
    role: (0, enums_1.messageRoleEnum)('role').notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at')
        .default((0, drizzle_orm_1.sql) `NOW() + INTERVAL '7 days'`)
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.chatsRelations = (0, drizzle_orm_1.relations)(exports.chats, ({ one, many }) => ({
    agent: one(agents_1.agents, {
        fields: [exports.chats.agentId],
        references: [agents_1.agents.id],
    }),
    project: one(workspace_1.projects, {
        fields: [exports.chats.projectId],
        references: [workspace_1.projects.id],
    }),
    messages: many(exports.messages),
}));
exports.messagesRelations = (0, drizzle_orm_1.relations)(exports.messages, ({ one, many }) => ({
    sender: one(users_1.users, {
        fields: [exports.messages.senderId],
        references: [users_1.users.id],
    }),
    agent: one(agents_1.agents, {
        fields: [exports.messages.agentId],
        references: [agents_1.agents.id],
    }),
    chat: one(exports.chats, {
        fields: [exports.messages.chatId],
        references: [exports.chats.id],
    }),
    room: one(exports.chatRooms, {
        fields: [exports.messages.roomId],
        references: [exports.chatRooms.id],
    }),
    parentMessage: one(exports.messages, {
        fields: [exports.messages.parentMessageId],
        references: [exports.messages.id],
        relationName: 'messageReplies',
    }),
    replies: many(exports.messages, { relationName: 'messageReplies' }),
    readReceipts: many(exports.readReceipts),
}));
exports.chatRoomParticipants = (0, pg_core_1.pgTable)('chat_room_participants', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    roomId: (0, pg_core_1.uuid)('room_id')
        .notNull()
        .references(() => exports.chatRooms.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).default('MEMBER').notNull(),
    joinedAt: (0, pg_core_1.timestamp)('joined_at').defaultNow().notNull(),
    lastReadAt: (0, pg_core_1.timestamp)('last_read_at'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
});
exports.readReceipts = (0, pg_core_1.pgTable)('read_receipts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    messageId: (0, pg_core_1.uuid)('message_id')
        .notNull()
        .references(() => exports.messages.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    readAt: (0, pg_core_1.timestamp)('read_at').defaultNow().notNull(),
});
exports.chatRoomParticipantsRelations = (0, drizzle_orm_1.relations)(exports.chatRoomParticipants, ({ one }) => ({
    room: one(exports.chatRooms, {
        fields: [exports.chatRoomParticipants.roomId],
        references: [exports.chatRooms.id],
    }),
    user: one(users_1.users, {
        fields: [exports.chatRoomParticipants.userId],
        references: [users_1.users.id],
    }),
}));
exports.readReceiptsRelations = (0, drizzle_orm_1.relations)(exports.readReceipts, ({ one }) => ({
    message: one(exports.messages, {
        fields: [exports.readReceipts.messageId],
        references: [exports.messages.id],
    }),
    user: one(users_1.users, {
        fields: [exports.readReceipts.userId],
        references: [users_1.users.id],
    }),
}));
exports.chatRoomsRelations = (0, drizzle_orm_1.relations)(exports.chatRooms, ({ one, many }) => ({
    owner: one(users_1.users, {
        fields: [exports.chatRooms.ownerId],
        references: [users_1.users.id],
    }),
    messages: many(exports.messages),
    participants: many(exports.chatRoomParticipants),
}));
//# sourceMappingURL=chat.js.map