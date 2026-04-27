import { createHash } from 'node:crypto';
import type { Socket } from 'node:net';
import type { FastifyPluginCallback } from 'fastify';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import * as dotenv from 'dotenv';
import { createDb } from '@repo/database';
import { healthRoutes } from './routes/health.js';
import { setupRoutes } from './routes/setup.js';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';
import { coreRoutes } from './routes/core.js';
import { eventsRoutes } from './routes/events.js';

dotenv.config();

declare module 'fastify' {
  interface Session {
    user?: { id: string; username: string; role: string };
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    trustProxy: true,
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

  const databaseUrl = process.env.DATABASE_URL;
  const db = databaseUrl ? createDb(databaseUrl) : null;

  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(cookie);
  await fastify.register(fastifySession as unknown as FastifyPluginCallback<any>, {
    secret: process.env.SESSION_SECRET || 'slidebolt-dev-secret-min-32-chars!!',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    saveUninitialized: false,
  });

  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(setupRoutes, { prefix: '/api' });
  await fastify.register(authRoutes, { prefix: '/api' });
  await fastify.register(usersRoutes, { prefix: '/api' });
  await fastify.register(coreRoutes, { prefix: '/api' });
  await fastify.register(eventsRoutes);

  fastify.get('/api/hello', async () => ({
    message: 'hello world',
    database: {
      configured: Boolean(db),
    },
  }));

  registerWebSocketLayer(fastify);

  return fastify;
}

function registerWebSocketLayer(fastify: FastifyInstance) {
  fastify.server.on('upgrade', (request, socket) => {
    const { url, headers } = request;
    if (url !== '/ws' || headers.upgrade?.toLowerCase() !== 'websocket') {
      socket.destroy();
      return;
    }

    const websocketKey = headers['sec-websocket-key'];
    if (typeof websocketKey !== 'string') {
      socket.destroy();
      return;
    }

    const acceptKey = createHash('sha1')
      .update(`${websocketKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest('base64');

    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '',
        '',
      ].join('\r\n')
    );

    attachWebSocketClient(socket as Socket, fastify);
  });
}

function attachWebSocketClient(socket: Socket, fastify: FastifyInstance) {
  sendWebSocketText(
    socket,
    JSON.stringify({
      type: 'welcome',
      message: 'WebSocket connection established',
      timestamp: new Date().toISOString(),
    })
  );

  const heartbeat = setInterval(() => {
    if (socket.destroyed) {
      clearInterval(heartbeat);
      return;
    }

    sendWebSocketText(
      socket,
      JSON.stringify({
        type: 'heartbeat',
        message: 'hello from websocket',
        timestamp: new Date().toISOString(),
      })
    );
  }, 30000);

  socket.on('data', (buffer) => {
    const opcode = buffer[0] & 0x0f;
    if (opcode === 0x8) {
      socket.end();
    }
  });

  socket.on('close', () => clearInterval(heartbeat));
  socket.on('end', () => clearInterval(heartbeat));
  socket.on('error', (error) => {
    clearInterval(heartbeat);
    fastify.log.warn(`WebSocket client error: ${error.message}`);
  });
}

function sendWebSocketText(socket: Socket, payload: string) {
  const message = Buffer.from(payload);

  if (message.length > 125) {
    throw new Error('WebSocket payload too large for the minimal server implementation');
  }

  const frame = Buffer.alloc(2 + message.length);
  frame[0] = 0x81;
  frame[1] = message.length;
  message.copy(frame, 2);
  socket.write(frame);
}
