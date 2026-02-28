"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionCounters = exports.applicationInfo = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').unique().notNull(),
    username: (0, pg_core_1.text)('username').unique().notNull(),
    password: (0, pg_core_1.text)('password').notNull(),
    name: (0, pg_core_1.text)('name'),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
exports.applicationInfo = (0, pg_core_1.pgTable)('application_info', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
exports.sessionCounters = (0, pg_core_1.pgTable)('session_counters', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    sessionId: (0, pg_core_1.text)('session_id').unique().notNull(),
    visits: (0, pg_core_1.integer)('visits').default(1).notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
