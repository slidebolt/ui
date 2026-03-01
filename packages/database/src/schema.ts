import { pgTable, uuid, text, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     text('email').unique().notNull(),
  username:  text('username').unique().notNull(),
  password:  text('password').notNull(),
  name:      text('name'),
  isSystem:  boolean('is_system').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const roles = pgTable('roles', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').unique().notNull(),
  description: text('description'),
  isSystem:    boolean('is_system').default(false).notNull(),
  createdAt:   timestamp('created_at').defaultNow(),
});

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));

export const rolePermissions = pgTable('role_permissions', {
  id:      uuid('id').primaryKey().defaultRandom(),
  roleId:  uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  action:  text('action').notNull(),  // 'manage' | 'read' | 'write'
  subject: text('subject').notNull(), // 'Device' | 'Entity' | 'Script' | 'Command' | 'User' | 'Role' | 'all'
});

export const applicationInfo = pgTable('application_info', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  description: text('description'),
  updatedAt:   timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const sessionCounters = pgTable('session_counters', {
  id:        uuid('id').primaryKey().defaultRandom(),
  sessionId: text('session_id').unique().notNull(),
  visits:    text('visits').notNull().default('1'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});
