import bcrypt from 'bcrypt';
import { createDb, users, roles, userRoles, rolePermissions, eq } from '@repo/database';
import { BUILT_IN_ROLE_PERMISSIONS } from './abilities.js';

/** Fixed UUIDs for system users — stable across all envs. */
export const SYSTEM_USER_IDS = {
  admin:    '00000000-0000-0000-0000-000000000001',
  operator: '00000000-0000-0000-0000-000000000002',
  viewer:   '00000000-0000-0000-0000-000000000003',
} as const;

export const SYSTEM_ROLE_NAMES = ['admin', 'operator', 'viewer'] as const;

export async function seedSystemDefaults(db: ReturnType<typeof createDb>, log: (msg: string) => void) {
  // 1. Seed built-in roles
  for (const roleName of SYSTEM_ROLE_NAMES) {
    const [existing] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
    if (!existing) {
      const [role] = await db.insert(roles).values({
        name:        roleName,
        description: `Built-in ${roleName} role`,
        isSystem:    true,
      }).returning();

      const perms = BUILT_IN_ROLE_PERMISSIONS[roleName];
      if (perms && role) {
        await db.insert(rolePermissions).values(
          perms.map(p => ({ roleId: role.id, action: p.action, subject: p.subject }))
        );
      }
      log(`Seeded role: ${roleName}`);
    }
  }

  // 2. Seed system users
  const systemUsers = [
    {
      id:       SYSTEM_USER_IDS.admin,
      username: process.env.DEFAULT_USER     ?? 'admin',
      email:    process.env.DEFAULT_EMAIL    ?? 'admin@example.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD    ?? process.env.DEFAULT_PASSWORD ?? 'admin',
      name:     'System Admin',
      roleName: 'admin' as const,
    },
    {
      id:       SYSTEM_USER_IDS.operator,
      username: process.env.DEFAULT_OPERATOR_USER     ?? 'operator',
      email:    process.env.DEFAULT_OPERATOR_EMAIL    ?? 'operator@example.com',
      password: process.env.DEFAULT_OPERATOR_PASSWORD ?? 'operator',
      name:     'System Operator',
      roleName: 'operator' as const,
    },
    {
      id:       SYSTEM_USER_IDS.viewer,
      username: process.env.DEFAULT_VIEWER_USER     ?? 'viewer',
      email:    process.env.DEFAULT_VIEWER_EMAIL    ?? 'viewer@example.com',
      password: process.env.DEFAULT_VIEWER_PASSWORD ?? 'viewer',
      name:     'System Viewer',
      roleName: 'viewer' as const,
    },
  ];

  for (const u of systemUsers) {
    const [existing] = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10);
      await db.insert(users).values({
        id:       u.id,
        username: u.username,
        email:    u.email,
        password: hashed,
        name:     u.name,
        isSystem: true,
      });

      const [role] = await db.select().from(roles).where(eq(roles.name, u.roleName)).limit(1);
      if (role) {
        await db.insert(userRoles).values({ userId: u.id, roleId: role.id });
      }
      log(`Seeded system user: ${u.username}`);
    }
  }
}
