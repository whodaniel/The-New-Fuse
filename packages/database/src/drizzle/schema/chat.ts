/**
 * Drizzle ORM Schema - Chat System
 */
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { agents } from './agents';
import { messageRoleEnum } from './enums';
import { users } from './users';

// =============================================================================
// CHAT
// =============================================================================

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// =============================================================================
// CHAT ROOM
// =============================================================================

export const chatRooms = pgTable('chat_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  topic: text('topic'),
  purpose: text('purpose'),
  type: varchar('type', { length: 50 }).default('GENERAL'),
  isPrivate: boolean('is_private').default(false).notNull(),
  isEphemeral: boolean('is_ephemeral').default(false).notNull(),
  maxParticipants: integer('max_participants').default(50),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
  settings: jsonb('settings'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  deletedAt: timestamp('deleted_at'),
});

// =============================================================================
// MESSAGE
// =============================================================================

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  role: messageRoleEnum('role').default('USER').notNull(),
  senderId: uuid('sender_id').references(() => users.id),
  senderName: varchar('sender_name', { length: 255 }),
  agentId: uuid('agent_id').references(() => agents.id),
  chatId: uuid('chat_id').references(() => chats.id),
  roomId: uuid('room_id').references(() => chatRooms.id),
  parentMessageId: uuid('parent_message_id'),
  metadata: jsonb('metadata'),
  attachments: jsonb('attachments').$type<string[]>().default([]).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isEdited: boolean('is_edited').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isEphemeral: boolean('is_ephemeral').default(false).notNull(),
  expiresAt: timestamp('expires_at'),
  reactions: jsonb('reactions'),
});

// =============================================================================
// CHAT MESSAGE (Ephemeral)
// =============================================================================

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  expiresAt: timestamp('expires_at')
    .default(sql`NOW() + INTERVAL '7 days'`)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const chatsRelations = relations(chats, ({ one, many }) => ({
  agent: one(agents, {
    fields: [chats.agentId],
    references: [agents.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [messages.agentId],
    references: [agents.id],
  }),
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  room: one(chatRooms, {
    fields: [messages.roomId],
    references: [chatRooms.id],
  }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
    relationName: 'messageReplies',
  }),
  replies: many(messages, { relationName: 'messageReplies' }),
  readReceipts: many(readReceipts),
}));

export const chatRoomParticipants = pgTable('chat_room_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id')
    .notNull()
    .references(() => chatRooms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('MEMBER').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  lastReadAt: timestamp('last_read_at'),
  metadata: jsonb('metadata'),
});

export const readReceipts = pgTable('read_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at').defaultNow().notNull(),
});

export const chatRoomParticipantsRelations = relations(chatRoomParticipants, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatRoomParticipants.roomId],
    references: [chatRooms.id],
  }),
  user: one(users, {
    fields: [chatRoomParticipants.userId],
    references: [users.id],
  }),
}));

export const readReceiptsRelations = relations(readReceipts, ({ one }) => ({
  message: one(messages, {
    fields: [readReceipts.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [readReceipts.userId],
    references: [users.id],
  }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  owner: one(users, {
    fields: [chatRooms.ownerId],
    references: [users.id],
  }),
  messages: many(messages),
  participants: many(chatRoomParticipants),
}));
