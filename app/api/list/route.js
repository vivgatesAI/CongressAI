import { initDb, getPool } from "@/lib/db";

export async function GET() {
  try {
    await initDb();
    const pool = getPool();
    const { rows } = await pool.query("select id, name, source_url, created_at from congress order by created_at desc limit 50");
    return Response.json({ items: rows });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
