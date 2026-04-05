"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalSkills = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.personalSkills = (0, pg_core_1.pgTable)('personal_skills', {
    id: (0, pg_core_1.uuid)('id').primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    slug: (0, pg_core_1.varchar)('slug', { length: 180 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 160 }).notNull(),
    description: (0, pg_core_1.text)('description').default('').notNull(),
    instructions: (0, pg_core_1.text)('instructions').notNull(),
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]).notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').$type().default({}).notNull(),
    isPrivate: (0, pg_core_1.boolean)('is_private').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    userSlugUniqueIdx: (0, pg_core_1.uniqueIndex)('personal_skills_user_slug_uq').on(table.userId, table.slug),
    userIdx: (0, pg_core_1.index)('personal_skills_user_idx').on(table.userId),
    userUpdatedIdx: (0, pg_core_1.index)('personal_skills_user_updated_idx').on(table.userId, table.updatedAt),
}));
//# sourceMappingURL=personal-skills.js.map