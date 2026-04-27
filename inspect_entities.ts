import WebSocket from 'ws';
import { createDb, tokens } from './packages/database/dist/index.js';
import * as dotenv from 'dotenv';

dotenv.config();

const coreApiUrl = process.env.CORE_API_URL || 'http://127.0.0.1:29011';
const databaseUrl = process.env.DATABASE_URL;

async function getCoreToken(): Promise<string | null> {
  if (!databaseUrl) return null;
  const db = createDb(databaseUrl);
  // @ts-ignore
  const rows = await db.select().from(tokens).limit(1);
  return rows.length > 0 ? rows[0].token : null;
}

async function run() {
  const token = await getCoreToken();
  if (!token) {
    console.error('No token found');
    process.exit(1);
  }

  const wsBase = coreApiUrl.replace(/^http/, 'ws');
  const wsUrl = `${wsBase}/ws/events?pattern=>&access_token=${token}`;
  
  const ws = new WebSocket(wsUrl);
  ws.on('open', () => {
    // Connection opened, wait for snapshot
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === 'snapshot') {
      console.log(JSON.stringify(msg.items, null, 2));
      ws.close();
      process.exit(0);
    }
  });

  ws.on('error', (err) => {
    console.error('WS Error:', err);
    process.exit(1);
  });

  setTimeout(() => {
    console.error('Timeout waiting for snapshot');
    process.exit(1);
  }, 10000);
}

run();
