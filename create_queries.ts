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

const queries = [
  // Room-based Queries
  {
    name: "Garage Entities",
    query: { pattern: ">", where: [{ field: "labels.Room", op: "eq", value: "Garage" }] }
  },
  {
    name: "Master Bedroom Lights",
    query: { pattern: ">", where: [
      { field: "labels.Room", op: "eq", value: "Master Bedroom" },
      { field: "type", op: "eq", value: "light" }
    ] }
  },
  {
    name: "Basement All",
    query: { pattern: ">", where: [{ field: "labels.Area", op: "eq", value: "Basement" }] }
  },
  {
    name: "Exterior Cameras",
    query: { pattern: ">", where: [
      { field: "labels.Area", op: "eq", value: "Exterior" },
      { field: "type", op: "eq", value: "frigate_camera" }
    ] }
  },
  {
    name: "Main Room Lights",
    query: { pattern: ">", where: [
      { field: "labels.Room", op: "eq", value: "Main Room" },
      { field: "type", op: "eq", value: "light" }
    ] }
  },
  {
    name: "Alex Room All",
    query: { pattern: ">", where: [{ field: "labels.Room", op: "eq", value: "Alex Room" }] }
  },
  {
    name: "Active Sensors",
    query: { pattern: ">", where: [
      { field: "type", op: "eq", value: "sensor" },
      { field: "state.value", op: "ne", value: 0 }
    ] }
  }
];

async function run() {
  const token = await getCoreToken();
  if (!token) {
    console.error('No token found');
    process.exit(1);
  }

  for (const q of queries) {
    console.log(`Creating query: ${q.name}`);
    const res = await fetch(`${coreApiUrl}/entities/sb-query/queries/${q.name.toLowerCase().replace(/ /g, '_')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'query',
        name: q.name,
        query: q.query
      })
    });
    
    if (res.ok) {
      console.log(`Successfully created ${q.name}`);
    } else {
      console.error(`Failed to create ${q.name}: ${res.status} ${await res.text()}`);
    }
  }
}

run();
