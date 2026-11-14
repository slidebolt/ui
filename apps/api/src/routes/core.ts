import { FastifyInstance, FastifyPluginOptions } from 'fastify';
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

async function coreRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getCoreToken();
  return fetch(`${coreApiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

async function safeJson(res: Response, reply: any) {
  if (res.status === 204) {
    return reply.status(204).send();
  }
  const data = await res.json().catch(() => ({}));
  return reply.status(res.status).send(data);
}

export async function coreRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  // Require session on all core proxy routes
  fastify.addHook('onRequest', async (request, reply) => {
    if (!request.session.user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }
  });

  fastify.get('/core/devices', async (_req, reply) => {
    const res = await coreRequest('/devices');
    return safeJson(res, reply);
  });

  fastify.get('/core/entities', async (_req, reply) => {
    const res = await coreRequest('/entities');
    return safeJson(res, reply);
  });

  fastify.get('/core/definitions', async (_req, reply) => {
    return safeJson(await coreRequest('/definitions'), reply);
  });

  fastify.get('/core/runtime/components', async (_req, reply) => {
    return safeJson(await coreRequest('/runtime/components'), reply);
  });

  fastify.get('/core/logs', async (req, reply) => {
    const query = new URLSearchParams(req.query as Record<string, string>).toString();
    return safeJson(await coreRequest(`/logs${query ? `?${query}` : ''}`), reply);
  });

  fastify.get('/core/logs/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    return safeJson(await coreRequest(`/logs/${encodeURIComponent(id)}`), reply);
  });

  fastify.get('/core/media/catalog/:provider/:server/:library', async (req, reply) => {
    const { provider, server, library } = req.params as Record<string, string>;
    const query = new URLSearchParams(req.query as Record<string, string>).toString();
    const path = `/media/catalog/${encodeURIComponent(provider)}/${encodeURIComponent(server)}/${encodeURIComponent(library)}${query ? `?${query}` : ''}`;
    return safeJson(await coreRequest(path), reply);
  });

  fastify.get('/core/tv/guide/:provider/:server', async (req, reply) => {
    const { provider, server } = req.params as Record<string, string>;
    const query = new URLSearchParams(req.query as Record<string, string>).toString();
    const path = `/tv/guide/${encodeURIComponent(provider)}/${encodeURIComponent(server)}${query ? `?${query}` : ''}`;
    return safeJson(await coreRequest(path), reply);
  });

  fastify.post('/core/query', async (req, reply) => {
    const res = await coreRequest('/query', {
      method: 'POST',
      body: JSON.stringify(req.body),
    });
    return safeJson(res, reply);
  });

  fastify.post('/core/entities/:key/command', async (req, reply) => {
    const { key } = req.params as { key: string };
    const { command, args = {} } = req.body as { command: string; args?: any };
    
    // Split key (e.g. plugin.device.entity) into segments
    const segments = key.split('.');
    if (segments.length < 3) {
      return reply.status(400).send({ error: 'Invalid entity key format' });
    }
    
    const [plugin, device, ...entityParts] = segments;
    const entity = entityParts.join('.');
    
    // Core API expects: POST /entities/{plugin}/{device}/{entity}/command/{action}
    const path = `/entities/${plugin}/${device}/${entity}/command/${command}`;
    
    fastify.log.info({ key, plugin, device, entity, command, path }, 'Proxying command to segmented Core API path');
    
    const res = await coreRequest(path, {
      method: 'POST',
      body: JSON.stringify(args), // Body should only contain the arguments
    });
    
    return safeJson(res, reply);
  });

  fastify.get('/core/scripts', async (_req, reply) => {
    const res = await coreRequest('/scripts');
    return safeJson(res, reply);
  });

  fastify.put('/core/scripts/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const res = await coreRequest(`/scripts/${name}`, {
      method: 'PUT',
      body: JSON.stringify(req.body),
    });
    return reply.status(res.status).send();
  });

  fastify.get('/core/tokens', async (_req, reply) => {
    const res = await coreRequest('/tokens');
    return safeJson(res, reply);
  });
}
