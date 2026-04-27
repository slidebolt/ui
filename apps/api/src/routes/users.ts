import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { createDb, users } from '@repo/database';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

export async function usersRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = databaseUrl ? createDb(databaseUrl) : null;

  fastify.get('/users/status', async (request, reply) => {
    if (!db) return { hasUsers: false };
    const existing = await db.select().from(users).limit(1);
    return { hasUsers: existing.length > 0 };
  });

  // Create the first admin — only works if no users exist
  fastify.post('/users/setup', async (request, reply) => {
    if (!db) return reply.status(500).send({ error: 'Database not configured' });

    const existing = await db.select().from(users).limit(1);
    if (existing.length > 0) {
      return reply.status(403).send({ error: 'Setup already complete' });
    }

    const { username, password } = request.body as { username?: string; password?: string };
    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }
    if (password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      username,
      passwordHash,
      role: 'admin',
    }).returning({ id: users.id, username: users.username, role: users.role });

    request.session.user = { id: user.id, username: user.username, role: user.role };
    await request.session.save();
    return { user };
  });
}
