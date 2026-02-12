import { initDb, getPool } from "@/lib/db";
import { toICal } from "@/lib/ical";

export async function GET(req) {
  try {
    await initDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

    const pool = getPool();
    const { rows } = await pool.query("select id, name, data from congress where id = $1", [id]);
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });

    const ics = toICal(rows[0]);
    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar",
        "Content-Disposition": `attachment; filename=congress-${id}.ics`,
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
