import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { createDb, tokens } from '@repo/database';
import * as dotenv from 'dotenv';

dotenv.config();

const coreApiUrl = process.env.CORE_API_URL || 'http://127.0.0.1:29011';
const databaseUrl = process.env.DATABASE_URL;

export async function setupRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = databaseUrl ? createDb(databaseUrl) : null;

  fastify.get('/setup/status', async (request, reply) => {
    if (!db) {
      return { connected: false, error: 'Database not configured' };
    }

    try {
      const existingTokens = await db.select().from(tokens).limit(1);
      if (existingTokens.length === 0) {
        return { connected: false, coreApiUrl };
      }

      // The token is durable configuration. Do not delete it because Core may
      // still be starting while the UI comes up. Proxy requests provide the
      // authoritative authentication result once the runtime is ready.
      return { connected: true, coreApiUrl };
    } catch (error) {
      fastify.log.error(error);
      return { connected: false, error: 'Failed to query database' };
    }
  });

  fastify.post('/setup/connect', async (request, reply) => {
    if (!db) {
      return reply.status(500).send({ error: 'Database not configured' });
    }

    try {
      // 1. Hit Core API to generate token
      const response = await fetch(`${coreApiUrl}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'SlideBolt UI',
          scopes: ['read', 'write', 'control', 'admin'],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return reply.status(response.status).send({ 
          error: `Core API error: ${errorText || response.statusText}` 
        });
      }

      const tokenData = await response.json() as {
        id: string;
        name: string;
        scopes: string[];
        token: string;
        createdAt: string;
      };

      // 2. Store in database
      await db.insert(tokens).values({
        id: tokenData.id,
        name: tokenData.name,
        scopes: tokenData.scopes,
        token: tokenData.token,
        createdAt: new Date(tokenData.createdAt),
      });

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
