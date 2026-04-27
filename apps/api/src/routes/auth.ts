import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { createDb, users, eq } from '@repo/database';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

export async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = databaseUrl ? createDb(databaseUrl) : null;

  fastify.get('/me', async (request, reply) => {
    if (!request.session.user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }
    return { user: request.session.user };
  });

  fastify.post('/login', async (request, reply) => {
    if (!db) return reply.status(500).send({ error: 'Database not configured' });

    const { username, password } = request.body as { username?: string; password?: string };
    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    request.session.user = { id: user.id, username: user.username, role: user.role };
    await request.session.save();
    return { user: { id: user.id, username: user.username, role: user.role } };
  });

  fastify.post('/logout', async (request, reply) => {
    await request.session.destroy();
    return { success: true };
  });
}
