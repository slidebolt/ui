import { FastifyInstance } from 'fastify';
import { and, createDb, desc, eq, pageBuilderPages } from '@repo/database';
import { requireAuth } from '../middleware/rbac.js';

export async function pageRoutes(fastify: FastifyInstance, opts: { db: ReturnType<typeof createDb> }) {
  const { db } = opts;

  fastify.get('/pages', { preHandler: requireAuth }, async (request) => {
    return db
      .select({
        id: pageBuilderPages.id,
        name: pageBuilderPages.name,
        blob: pageBuilderPages.blob,
        createdAt: pageBuilderPages.createdAt,
        updatedAt: pageBuilderPages.updatedAt,
      })
      .from(pageBuilderPages)
      .where(eq(pageBuilderPages.userId, request.session.user.id))
      .orderBy(desc(pageBuilderPages.updatedAt));
  });

  fastify.get<{ Params: { id: string } }>('/pages/:id', { preHandler: requireAuth }, async (request, reply) => {
    const [page] = await db
      .select({
        id: pageBuilderPages.id,
        name: pageBuilderPages.name,
        blob: pageBuilderPages.blob,
        createdAt: pageBuilderPages.createdAt,
        updatedAt: pageBuilderPages.updatedAt,
      })
      .from(pageBuilderPages)
      .where(and(eq(pageBuilderPages.id, request.params.id), eq(pageBuilderPages.userId, request.session.user.id)))
      .limit(1);

    if (!page) return reply.code(404).send({ error: 'Page not found' });
    return page;
  });

  fastify.post<{ Body: { name?: string; blob?: unknown } }>('/pages', { preHandler: requireAuth }, async (request, reply) => {
    const name = request.body?.name?.trim();
    if (!name) return reply.code(400).send({ error: 'name is required' });
    if (request.body?.blob === undefined) return reply.code(400).send({ error: 'blob is required' });

    const [created] = await db.insert(pageBuilderPages).values({
      userId: request.session.user.id,
      name,
      blob: request.body.blob,
    }).returning({
      id: pageBuilderPages.id,
      name: pageBuilderPages.name,
      blob: pageBuilderPages.blob,
      createdAt: pageBuilderPages.createdAt,
      updatedAt: pageBuilderPages.updatedAt,
    });

    return reply.code(201).send(created);
  });

  fastify.put<{ Params: { id: string }; Body: { name?: string; blob?: unknown } }>(
    '/pages/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const name = request.body?.name?.trim();
      const hasName = typeof request.body?.name === 'string';
      const hasBlob = request.body?.blob !== undefined;
      if (!hasName && !hasBlob) return reply.code(400).send({ error: 'name or blob is required' });
      if (hasName && !name) return reply.code(400).send({ error: 'name cannot be empty' });

      const updates: { name?: string; blob?: unknown } = {};
      if (hasName) updates.name = name;
      if (hasBlob) updates.blob = request.body.blob;

      const [updated] = await db
        .update(pageBuilderPages)
        .set(updates)
        .where(and(eq(pageBuilderPages.id, request.params.id), eq(pageBuilderPages.userId, request.session.user.id)))
        .returning({
          id: pageBuilderPages.id,
          name: pageBuilderPages.name,
          blob: pageBuilderPages.blob,
          createdAt: pageBuilderPages.createdAt,
          updatedAt: pageBuilderPages.updatedAt,
        });

      if (!updated) return reply.code(404).send({ error: 'Page not found' });
      return updated;
    }
  );

  fastify.delete<{ Params: { id: string } }>('/pages/:id', { preHandler: requireAuth }, async (request, reply) => {
    const deleted = await db
      .delete(pageBuilderPages)
      .where(and(eq(pageBuilderPages.id, request.params.id), eq(pageBuilderPages.userId, request.session.user.id)))
      .returning({ id: pageBuilderPages.id });

    if (deleted.length === 0) return reply.code(404).send({ error: 'Page not found' });
    return reply.code(204).send();
  });
}
