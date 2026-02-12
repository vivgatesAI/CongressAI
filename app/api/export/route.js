import { initDb, getPool } from "@/lib/db";

function toCSV(congress) {
  const sessions = congress?.data?.sessions || [];
  const header = "id,title,type,track,date,startTime,endTime,location,speakers,topics";
  const rows = sessions.map((s) => [
    s.id,
    JSON.stringify(s.title || ""),
    JSON.stringify(s.type || ""),
    JSON.stringify(s.track || ""),
    JSON.stringify(s.date || ""),
    JSON.stringify(s.startTime || ""),
    JSON.stringify(s.endTime || ""),
    JSON.stringify(s.location || ""),
    JSON.stringify((s.speakers || []).join("; ")),
    JSON.stringify((s.topics || []).join("; ")),
  ].join(","));
  return [header, ...rows].join("\n");
}

export async function GET(req) {
  try {
    await initDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

    const pool = getPool();
    const { rows } = await pool.query("select id, name, data from congress where id = $1", [id]);
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });

    const csv = toCSV(rows[0]);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=congress-${id}.csv`,
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
