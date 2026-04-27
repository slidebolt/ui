import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const appState = pgTable('app_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  payload: jsonb('payload').notNull().default({}),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const tokens = pgTable('tokens', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  scopes: jsonb('scopes').$type<string[]>().notNull(),
  token: text('token').notNull(), // The raw secret
  createdAt: timestamp('created_at').notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('viewer'), // 'admin' | 'operator' | 'viewer'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});
