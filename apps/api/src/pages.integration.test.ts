import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createDb, pageBuilderPages, eq, or } from '@repo/database';
import { config as dotenvConfig } from 'dotenv';
import { buildApp } from './app.js';
import { SYSTEM_USER_IDS } from './seed.js';

dotenvConfig({ path: new URL('../../../.env.dev', import.meta.url).pathname });

describe('Page persistence API integration', () => {
  let app: FastifyInstance;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required for integration tests');
  const db = createDb(databaseUrl);

  const login = async (username: string, password: string) => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { username, password },
    });
    expect(response.statusCode).toBe(200);
    const cookie = response.headers['set-cookie'];
    return Array.isArray(cookie) ? cookie[0] : cookie;
  };

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(async () => {
    await db
      .delete(pageBuilderPages)
      .where(
        or(
          eq(pageBuilderPages.userId, SYSTEM_USER_IDS.admin),
          eq(pageBuilderPages.userId, SYSTEM_USER_IDS.viewer)
        )
      );
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires auth for page endpoints', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/pages' });
    expect(response.statusCode).toBe(401);
  });

  it('creates, loads, updates, lists, and deletes a page', async () => {
    const cookie = await login('admin', 'admin');

    const createPayload = {
      name: 'Bedroom Layout',
      blob: {
        id: 'page-lights-grid-1',
        items: [{ id: 'row-h-1', type: 'row', direction: 'horizontal', children: [] }],
      },
    };

    const createdResponse = await app.inject({
      method: 'POST',
      url: '/api/pages',
      headers: { cookie },
      payload: createPayload,
    });
    expect(createdResponse.statusCode).toBe(201);
    const created = JSON.parse(createdResponse.body) as { id: string; name: string; blob: { id: string } };
    expect(created.name).toBe(createPayload.name);
    expect(created.blob.id).toBe('page-lights-grid-1');

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/pages',
      headers: { cookie },
    });
    expect(listResponse.statusCode).toBe(200);
    const list = JSON.parse(listResponse.body) as Array<{ id: string; name: string }>;
    expect(list.some((page) => page.id === created.id && page.name === createPayload.name)).toBe(true);

    const loadResponse = await app.inject({
      method: 'GET',
      url: `/api/pages/${created.id}`,
      headers: { cookie },
    });
    expect(loadResponse.statusCode).toBe(200);
    const loaded = JSON.parse(loadResponse.body) as { id: string; name: string; blob: { id: string } };
    expect(loaded.id).toBe(created.id);
    expect(loaded.blob.id).toBe('page-lights-grid-1');

    const updatedPayload = {
      name: 'Bedroom Layout v2',
      blob: {
        id: 'page-lights-grid-2',
        items: [{ id: 'row-h-2', type: 'row', direction: 'horizontal', children: [] }],
      },
    };
    const updateResponse = await app.inject({
      method: 'PUT',
      url: `/api/pages/${created.id}`,
      headers: { cookie },
      payload: updatedPayload,
    });
    expect(updateResponse.statusCode).toBe(200);
    const updated = JSON.parse(updateResponse.body) as { name: string; blob: { id: string } };
    expect(updated.name).toBe(updatedPayload.name);
    expect(updated.blob.id).toBe('page-lights-grid-2');

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/pages/${created.id}`,
      headers: { cookie },
    });
    expect(deleteResponse.statusCode).toBe(204);

    const missingResponse = await app.inject({
      method: 'GET',
      url: `/api/pages/${created.id}`,
      headers: { cookie },
    });
    expect(missingResponse.statusCode).toBe(404);
  });

  it('isolates pages by user', async () => {
    const adminCookie = await login('admin', 'admin');

    const createdResponse = await app.inject({
      method: 'POST',
      url: '/api/pages',
      headers: { cookie: adminCookie },
      payload: {
        name: 'Admin Private Page',
        blob: { id: 'admin-page', items: [] },
      },
    });
    expect(createdResponse.statusCode).toBe(201);
    const created = JSON.parse(createdResponse.body) as { id: string };

    const viewerCookie = await login('viewer', 'viewer');

    const loadAsViewer = await app.inject({
      method: 'GET',
      url: `/api/pages/${created.id}`,
      headers: { cookie: viewerCookie },
    });
    expect(loadAsViewer.statusCode).toBe(404);
  });
});
