import { FastifyInstance } from 'fastify';
import { createDb, roles, rolePermissions, eq } from '@repo/database';

export async function roleRoutes(fastify: FastifyInstance, opts: { db: ReturnType<typeof createDb> }) {
  const { db } = opts;

  // List roles
  fastify.get('/roles', async () => {
    return db.select({ id: roles.id, name: roles.name, description: roles.description, isSystem: roles.isSystem })
      .from(roles);
  });

  // Get role by id (with permissions)
  fastify.get<{ Params: { id: string } }>('/roles/:id', async (request, reply) => {
    const [role] = await db.select().from(roles).where(eq(roles.id, request.params.id)).limit(1);
    if (!role) return reply.code(404).send({ error: 'Role not found' });

    const perms = await db.select({ action: rolePermissions.action, subject: rolePermissions.subject })
      .from(rolePermissions).where(eq(rolePermissions.roleId, role.id));

    return { ...role, permissions: perms };
  });

  // Create custom role
  fastify.post<{ Body: { name: string; description?: string; permissions: Array<{ action: string; subject: string }> } }>(
    '/roles',
    async (request, reply) => {
      const { name, description, permissions = [] } = request.body;
      if (!name) return reply.code(400).send({ error: 'name is required' });

      const [role] = await db.insert(roles).values({ name, description, isSystem: false }).returning();
      if (permissions.length > 0 && role) {
        await db.insert(rolePermissions).values(
          permissions.map(p => ({ roleId: role.id, action: p.action, subject: p.subject }))
        );
      }

      return reply.code(201).send({ ...role, permissions });
    }
  );

  // Update custom role
  fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string; permissions?: Array<{ action: string; subject: string }> } }>(
    '/roles/:id',
    async (request, reply) => {
      const [existing] = await db.select().from(roles).where(eq(roles.id, request.params.id)).limit(1);
      if (!existing) return reply.code(404).send({ error: 'Role not found' });
      if (existing.isSystem) return reply.code(403).send({ error: 'Cannot modify a system role' });

      const { name, description, permissions } = request.body;
      const updates: Record<string, unknown> = {};
      if (name)        updates.name        = name;
      if (description !== undefined) updates.description = description;

      if (Object.keys(updates).length > 0) {
        await db.update(roles).set(updates).where(eq(roles.id, existing.id));
      }

      if (permissions !== undefined) {
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, existing.id));
        if (permissions.length > 0) {
          await db.insert(rolePermissions).values(
            permissions.map(p => ({ roleId: existing.id, action: p.action, subject: p.subject }))
          );
        }
      }

      const [updated] = await db.select().from(roles).where(eq(roles.id, existing.id)).limit(1);
      return updated;
    }
  );

  // Delete custom role
  fastify.delete<{ Params: { id: string } }>('/roles/:id', async (request, reply) => {
    const [existing] = await db.select().from(roles).where(eq(roles.id, request.params.id)).limit(1);
    if (!existing) return reply.code(404).send({ error: 'Role not found' });
    if (existing.isSystem) return reply.code(403).send({ error: 'Cannot delete a system role' });

    await db.delete(roles).where(eq(roles.id, existing.id));
    return reply.code(204).send();
  });
}
