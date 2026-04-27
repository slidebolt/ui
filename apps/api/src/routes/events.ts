import { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { createDb, tokens } from '@repo/database';
import * as dotenv from 'dotenv';

dotenv.config();

const coreApiUrl = process.env.CORE_API_URL || 'http://127.0.0.1:29011';
const databaseUrl = process.env.DATABASE_URL;

async function getCoreToken(): Promise<string | null> {
  if (!databaseUrl) return null;
  const db = createDb(databaseUrl);
  const rows = await db.select().from(tokens).limit(1);
  return rows.length > 0 ? rows[0].token : null;
}

export async function eventsRoutes(fastify: FastifyInstance) {
  // GET /api/events?pattern=plugin.dev1.>
  // SSE stream: proxies Core API WebSocket events to the browser
  fastify.get('/api/events', async (request, reply) => {
    if (!request.session.user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const { pattern = '>' } = request.query as { pattern?: string };

    const token = await getCoreToken();
    if (!token) {
      return reply.status(503).send({ error: 'Core API token not available' });
    }

    // Build the Core WebSocket URL
    const wsBase = coreApiUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/events?pattern=${encodeURIComponent(pattern)}&access_token=${token}`;

    // SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    reply.raw.flushHeaders?.();

    const send = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      send('connected', { pattern });
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        // Core sends: { type: "snapshot"|"upsert"|"remove", key, data }
        send(msg.type ?? 'message', msg);
      } catch {
        // ignore malformed frames
      }
    });

    ws.on('error', (err) => {
      send('error', { message: err.message });
      reply.raw.end();
    });

    ws.on('close', () => {
      send('close', {});
      reply.raw.end();
    });

    // When the browser disconnects, close the upstream WS
    request.raw.on('close', () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    });

    // Keep the reply open
    await new Promise<void>((resolve) => {
      request.raw.on('close', resolve);
    });
  });
}
