"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLogs = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.apiLogs = (0, pg_core_1.pgTable)('api_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    method: (0, pg_core_1.varchar)('method', { length: 10 }).notNull(),
    path: (0, pg_core_1.text)('path').notNull(),
    statusCode: (0, pg_core_1.integer)('status_code').notNull(),
    duration: (0, pg_core_1.integer)('duration').notNull(), // in milliseconds
    ip: (0, pg_core_1.varchar)('ip', { length: 45 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    userId: (0, pg_core_1.uuid)('user_id').references(() => users_1.users.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
//# sourceMappingURL=api-logs.js.map