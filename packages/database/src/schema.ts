import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  name: text('name'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const applicationInfo = pgTable('application_info', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const sessionCounters = pgTable('session_counters', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').unique().notNull(),
  visits: integer('visits').default(1).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});
