import { veniceEmbeddings } from "@/lib/venice";

export async function POST(req) {
  try {
    const { input } = await req.json();
    if (!input) return Response.json({ error: "Missing input" }, { status: 400 });

    const model = process.env.VENICE_MODEL_EMBED || "text-embedding-bge-m3";
    const data = await veniceEmbeddings({ model, input });
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
