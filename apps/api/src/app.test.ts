import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from './app.js';
import { FastifyInstance } from 'fastify';

describe('API Server', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
  });

  it('should login with default credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: {
        username: 'admin',
        password: 'admin'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('success');
    expect(body.user.username).toBe('admin');
  });

  it('should fail login with wrong credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: {
        username: 'admin',
        password: 'wrong-password'
      }
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 401 for /api/me when not logged in', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/me'
    });

    expect(response.statusCode).toBe(401);
  });

  it('should proxy /api/plugins to internal service', async () => {
    // 1. Login to get session
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { username: 'admin', password: 'admin' }
    });
    const cookie = loginResponse.headers['set-cookie'];

    // 2. Mock global fetch
    const mockPlugins = { gateway: { manifest: { name: 'Test Gateway' } } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPlugins
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/plugins',
      headers: {
        cookie: Array.isArray(cookie) ? cookie[0] : cookie
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.gateway.manifest.name).toBe('Test Gateway');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should return app info', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/info'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.name).toBe('AI Plugin Gateway');
  });
});
