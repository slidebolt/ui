import { createDb } from './packages/database/src/index.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.dev' });

const dbUrl = process.env.DATABASE_URL;
console.log('Testing DB URL:', dbUrl);

if (!dbUrl) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

try {
  const db = createDb(dbUrl);
  console.log('Database initialized');
  process.exit(0);
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}
