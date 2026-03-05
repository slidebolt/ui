import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { createDb, users, eq } from '@repo/database';
import { healthRoutes } from './routes/health.js';
import { userRoutes } from './routes/users.js';
import { roleRoutes } from './routes/roles.js';
import { pageRoutes } from './routes/pages.js';
import { seedSystemDefaults } from './seed.js';
import { rbacHook } from './middleware/rbac.js';

dotenv.config();

declare module 'fastify' {
  interface Session {
    user: { id: string; username: string };
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  const db = createDb(process.env.DATABASE_URL!);

  // Register Plugins
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(cookie);
  await fastify.register(session as any, {
    secret: process.env.SESSION_SECRET || 'a-very-long-secret-key-that-is-at-least-32-chars',
    cookie: { secure: false },
  });

  const INTERNAL_SERVICE_URL = process.env.INTERNAL_SERVICE_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:39011'
      : 'http://127.0.0.1:39011');

  // Seed system roles + users on every startup
  try {
    await seedSystemDefaults(db, msg => fastify.log.info(msg));
  } catch (err) {
    fastify.log.error(`Failed to seed system defaults: ${err}`);
  }

  // Auth Routes (public — no RBAC)
  fastify.post('/api/login', async (request, reply) => {
    const { username, password } = request.body as any;
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (user && await bcrypt.compare(password, user.password)) {
      request.session.user = { id: user.id, username: user.username };
      return { status: 'success', user: { id: user.id, username: user.username } };
    }

    return reply.code(401).send({ error: 'Invalid credentials' });
  });

  fastify.post('/api/logout', async (request, reply) => {
    await request.session.destroy();
    return reply.code(204).send();
  });

  fastify.get('/api/me', async (request, reply) => {
    if (!request.session.user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }
    return { user: request.session.user };
  });

  // Register Routes
  await fastify.register(healthRoutes, { prefix: '/api' });

  // User + Role management (RBAC-protected: manage:User / manage:Role)
  const rbac = rbacHook(db);
  await fastify.register(userRoutes, { prefix: '/api', db });
  await fastify.register(roleRoutes, { prefix: '/api', db });
  await fastify.register(pageRoutes, { prefix: '/api', db });

  // Apply RBAC preHandler to all /api/users* and /api/roles* routes
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/api/users') || request.url.startsWith('/api/roles')) {
      await rbac(request, reply);
    }
  });

  // Proxy routes (RBAC-enforced)
  const proxyPaths = ['/api/plugins*', '/api/search*', '/api/schema*', '/api/batch*', '/api/journal*', '/api/history*', '/api/labels*'];

  proxyPaths.forEach(path => {
    fastify.all(path, { preHandler: rbac }, async (request, reply) => {
      const url = `${INTERNAL_SERVICE_URL}${request.url}`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const fetchOptions: RequestInit = {
          method: request.method,
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        };

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && request.body) {
          fetchOptions.body = JSON.stringify(request.body);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          fastify.log.error(`Internal service error (${path}): ${response.status} ${errorText}`);
          return reply.code(response.status).send({ error: 'Internal service error', details: errorText });
        }

        const data = await response.json();
        return reply.code(response.status).send(data);
      } catch (err) {
        fastify.log.error(`Proxy failure (${path}): ${err instanceof Error ? err.message : String(err)}`);
        return reply.code(500).send({
          error: 'Failed to connect to internal gateway',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    });
  });

  fastify.get('/api/info', async () => {
    let coreVersion = 'unknown';
    try {
      const res = await fetch(`${INTERNAL_SERVICE_URL}/_internal/runtime`);
      if (res.ok) {
        const runtime = await res.json() as any;
        coreVersion = runtime.version || 'unknown';
      }
    } catch {}
    return {
      name: 'SlideBolt',
      description: 'Unified interface for Plugin, Device, and Entity management.',
      version: process.env.APP_VERSION || 'dev',
      coreVersion,
    };
  });

  // Browser-facing SSE fan-out endpoint
  const browserSubscribers = new Set<(line: string) => void>();

  fastify.get('/api/topics/subscribe', async (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no');
    reply.raw.flushHeaders();

    const send = (line: string) => {
      reply.raw.write(line);
    };
    browserSubscribers.add(send);
    request.raw.on('close', () => browserSubscribers.delete(send));
  });

  startTopicStream(INTERNAL_SERVICE_URL, fastify, browserSubscribers);

  return fastify;
}

function startTopicStream(
  coreUrl: string,
  fastify: FastifyInstance,
  browserSubscribers: Set<(line: string) => void>,
) {
  const connect = async () => {
    try {
      const res = await fetch(`${coreUrl}/api/topics/subscribe`);
      if (!res.ok || !res.body) {
        throw new Error(`SSE connect failed: ${res.status}`);
      }
      fastify.log.info('[topics] connected to core event stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const msg = JSON.parse(line.slice(6));
            if (msg.type === 'device') {
              fastify.log.info(`[topics] device changed: plugin=${msg.plugin_id} device=${msg.device_id}`);
            } else if (msg.type === 'entity') {
              fastify.log.info(`[topics] entity changed: plugin=${msg.plugin_id} device=${msg.device_id} entity=${msg.entity_id}`);
            }
            // Fan out to all connected browser clients
            const sseLine = `data: ${line.slice(6)}\n\n`;
            for (const send of browserSubscribers) {
              send(sseLine);
            }
          } catch {}
        }
      }
      throw new Error('stream ended');
    } catch (err) {
      fastify.log.warn(`[topics] disconnected: ${err instanceof Error ? err.message : String(err)}, reconnecting in 3s`);
    }
    setTimeout(connect, 3000);
  };
  connect();
}
