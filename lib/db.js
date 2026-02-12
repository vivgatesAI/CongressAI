import pg from "pg";

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function initDb() {
  const client = await getPool().connect();
  try {
    await client.query(`
      create table if not exists congress (
        id uuid primary key,
        name text,
        source_url text,
        created_at timestamptz default now(),
        data jsonb
      );

      create table if not exists session_embeddings (
        id uuid primary key,
        congress_id uuid references congress(id) on delete cascade,
        session_id text,
        vector float8[],
        metadata jsonb
      );
    `);
  } finally {
    client.release();
  }
}
