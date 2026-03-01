import { FastifyRequest, FastifyReply } from 'fastify';
import { createDb, users, userRoles, roles, rolePermissions, eq } from '@repo/database';
import { buildAbility, Action, Subject } from '../abilities.js';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;

/** Map an incoming request to the CASL ability it requires. */
function requiredAbility(method: Method, url: string): [Action, Subject] {
  const m = method.toUpperCase();

  // User/role management routes (handled by API server directly, not proxied)
  if (url.startsWith('/api/users')) return ['manage', 'User'];
  if (url.startsWith('/api/roles')) return ['manage', 'Role'];

  // Commands and events
  if (url.includes('/commands') || url.includes('/events')) return ['write', 'Command'];

  // Scripts
  if (url.includes('/script')) return m === 'GET' ? ['read', 'Script'] : ['write', 'Script'];

  // Entities (check before devices since path is nested)
  if (url.includes('/entities')) return m === 'GET' ? ['read', 'Entity'] : ['write', 'Entity'];

  // Batch — POST to /fetch is a read; /create and other methods are writes
  if (url.startsWith('/api/batch')) {
    if (m === 'GET' || (m === 'POST' && !url.endsWith('/create'))) return ['read', 'Device'];
    return ['write', 'Device'];
  }

  // Devices, plugins, search, schema, journal — all fold into Device
  return m === 'GET' ? ['read', 'Device'] : ['write', 'Device'];
}

/** Build a Fastify preHandler that enforces RBAC using CASL. */
export function rbacHook(db: ReturnType<typeof createDb>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionUser = request.session.user;
    if (!sessionUser) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    // Load user's role names from DB
    const rows = await db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, sessionUser.id));

    const roleNames = rows.map(r => r.name);
    const ability   = buildAbility(roleNames);

    const [action, subject] = requiredAbility(request.method, request.url);

    if (!ability.can(action, subject)) {
      return reply.code(403).send({ error: 'Forbidden', required: `${action}:${subject}` });
    }
  };
}

/** Standalone auth check (401 only, no RBAC) — for public-ish routes that just need a session. */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.session.user) {
    return reply.code(401).send({ error: 'Authentication required' });
  }
}
