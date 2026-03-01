import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { createDb, users, roles, userRoles, eq, and } from '@repo/database';
import { SYSTEM_USER_IDS } from '../seed.js';

export async function userRoutes(fastify: FastifyInstance, opts: { db: ReturnType<typeof createDb> }) {
  const { db } = opts;

  // List users
  fastify.get('/users', async () => {
    const rows = await db.select({
      id:       users.id,
      username: users.username,
      email:    users.email,
      name:     users.name,
      isSystem: users.isSystem,
    }).from(users);
    return rows;
  });

  // Get user by id
  fastify.get<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
    const [user] = await db.select({
      id:       users.id,
      username: users.username,
      email:    users.email,
      name:     users.name,
      isSystem: users.isSystem,
    }).from(users).where(eq(users.id, request.params.id)).limit(1);

    if (!user) return reply.code(404).send({ error: 'User not found' });

    const roleRows = await db
      .select({ id: roles.id, name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));

    return { ...user, roles: roleRows };
  });

  // Create user
  fastify.post<{ Body: { username: string; email: string; password: string; name?: string; roleIds?: string[] } }>(
    '/users',
    async (request, reply) => {
      const { username, email, password, name, roleIds = [] } = request.body;
      if (!username || !email || !password) {
        return reply.code(400).send({ error: 'username, email and password are required' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const [user] = await db.insert(users).values({ username, email, password: hashed, name }).returning();

      if (roleIds.length > 0 && user) {
        await db.insert(userRoles).values(roleIds.map(rid => ({ userId: user.id, roleId: rid })));
      }

      return reply.code(201).send({ id: user!.id, username, email, name, isSystem: false });
    }
  );

  // Update user
  fastify.put<{ Params: { id: string }; Body: { username?: string; email?: string; name?: string; password?: string; roleIds?: string[] } }>(
    '/users/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { username, email, name, password, roleIds } = request.body;

      const updates: Record<string, unknown> = {};
      if (username) updates.username = username;
      if (email)    updates.email    = email;
      if (name)     updates.name     = name;
      if (password) updates.password = await bcrypt.hash(password, 10);

      if (Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.id, id));
      }

      if (roleIds !== undefined) {
        // Protect system user: admin must always keep admin role
        const systemAdminId = SYSTEM_USER_IDS.admin;
        if (id === systemAdminId) {
          const adminRole = await db.select().from(roles).where(eq(roles.name, 'admin')).limit(1);
          const adminRoleId = adminRole[0]?.id;
          if (adminRoleId && !roleIds.includes(adminRoleId)) {
            return reply.code(403).send({ error: 'Cannot remove admin role from the system admin user' });
          }
        }
        await db.delete(userRoles).where(eq(userRoles.userId, id));
        if (roleIds.length > 0) {
          await db.insert(userRoles).values(roleIds.map(rid => ({ userId: id, roleId: rid })));
        }
      }

      const [updated] = await db.select({ id: users.id, username: users.username, email: users.email, name: users.name })
        .from(users).where(eq(users.id, id)).limit(1);
      if (!updated) return reply.code(404).send({ error: 'User not found' });
      return updated;
    }
  );

  // Delete user
  fastify.delete<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
    const { id } = request.params;

    const systemIds = Object.values(SYSTEM_USER_IDS) as string[];
    if (systemIds.includes(id)) {
      return reply.code(403).send({ error: 'Cannot delete a system user' });
    }

    const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    if (result.length === 0) return reply.code(404).send({ error: 'User not found' });
    return reply.code(204).send();
  });
}
