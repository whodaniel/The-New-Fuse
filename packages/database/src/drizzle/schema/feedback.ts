/**
 * Drizzle ORM Schema - Feedback System
 * 
 * Integrated with task and agent system for closed-loop development
 */
import { relations } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { agents } from './agents.js';
import { users } from './users.js';
import { tasks } from './tasks.js';

// =============================================================================
// FEEDBACK TYPES
// =============================================================================

export const feedbackTypeEnum = pgTable('feedback_type_enum', {
  value: varchar('value', { length: 50 }).notNull(),
});

export const feedbackPriorityEnum = pgTable('feedback_priority_enum', {
  value: varchar('value', { length: 50 }).notNull(),
});

export const feedbackStatusEnum = pgTable('feedback_status_enum', {
  value: varchar('value', { length: 50 }).notNull(),
});

// =============================================================================
// FEEDBACK
// =============================================================================

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Core fields
  type: varchar('type', { length: 50 }).notNull().default('other'),
  message: text('message').notNull(),
  source: varchar('source', { length: 50 }).notNull().default('beta'),
  
  // Context (optional)
  contextUrl: text('context_url'),
  userAgent: text('user_agent'),
  screenResolution: varchar('screen_resolution', { length: 50 }),
  screenshotUrl: text('screenshot_url'),
  stepsToReproduce: text('steps_to_reproduce'),
  
  // Metadata
  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  status: varchar('status', { length: 50 }).notNull().default('new'),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  // Linking
  linkedTaskId: uuid('linked_task_id'),
  linkedCommits: jsonb('linked_commits').$type<string[]>().default([]),
  
  // Reporter
  reporterId: uuid('reporter_id').references(() => users.id),
  reporterName: varchar('reporter_name', { length: 255 }),
  reporterEmail: varchar('reporter_email', { length: 255 }),
  
  // System
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const feedbackRelations = relations(feedback, ({ one, many }) => ({
  // Feedback can be linked to a task
  linkedTask: one(tasks, {
    fields: [feedback.linkedTaskId],
    references: [tasks.id],
  }),
  // Feedback can be reported by a user
  reporter: one(users, {
    fields: [feedback.reporterId],
    references: [users.id],
  }),
}));

// =============================================================================
// FEEDBACK TASK LINK
// =============================================================================

// Some feedback might reference a task and vice versa
export const feedbackToTasks = pgTable('feedback_to_tasks', {
  feedbackId: uuid('feedback_id')
    .notNull()
    .references(() => feedback.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// EXPORTS
// =============================================================================

export type Feedback = typeof feedback.$inferSelect;
export type FeedbackInsert = typeof feedback.$inferInsert;