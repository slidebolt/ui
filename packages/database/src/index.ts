import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

export { appState, tokens, users } from './schema.js';
export * from 'drizzle-orm';

export const createDb = (url: string) => {
  const pool = new pg.Pool({
    connectionString: url,
  });
  return drizzle(pool, { schema });
};
