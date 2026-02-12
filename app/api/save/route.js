import { initDb, getPool } from "@/lib/db";
import { newId } from "@/lib/uuid";

export async function POST(req) {
  try {
    await initDb();
    const { name, source_url, data } = await req.json();
    if (!data) return Response.json({ error: "Missing data" }, { status: 400 });

    const id = newId();
    const pool = getPool();
    await pool.query(
      "insert into congress (id, name, source_url, data) values ($1, $2, $3, $4)",
      [id, name || data?.conference?.name || null, source_url || null, data]
    );

    return Response.json({ id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
